import type {
  DummyCommentsResponse,
  DummyPost,
  DummyPostsResponse,
  DummyUser,
  PersistedPostsState,
  PostDetails,
  PostListItem,
  PostOverrides,
} from '~/types/dummyjson'
import { applyOverrides, toPostListItem, withPatchedPost } from '~/lib/post-utils'

const BASE_URL = 'https://dummyjson.com'
const PAGE_SIZE = 10
const SESSION_STORAGE_KEY = 'dummyjson-posts-state-v1'

function getFullName(user: DummyUser): string {
  const middle = user.maidenName ? ` ${user.maidenName}` : ''
  return `${user.firstName}${middle} ${user.lastName}`.trim()
}

function toDetails(post: DummyPost, user: DummyUser, comments: DummyCommentsResponse['comments']): PostDetails {
  return {
    ...toPostListItem(post),
    tags: post.tags,
    comments: comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      username: comment.user.username,
      likes: comment.likes,
    })),
    user: {
      fullName: getFullName(user),
      username: user.username,
      title: user.company?.title ?? 'Не указано',
      department: user.company?.department ?? 'Не указано',
    },
  }
}

export function usePosts() {
  const posts = useState<PostListItem[]>('posts-list', () => [])
  const total = useState<number>('posts-total', () => 0)
  const currentPage = useState<number>('posts-page', () => 1)
  const loadedSkips = useState<number[]>('posts-loaded-skips', () => [])
  const overrides = useState<PostOverrides>('posts-overrides', () => ({}))
  const detailsCache = useState<Record<number, PostDetails>>('posts-details-cache', () => ({}))
  const selectedPostId = useState<number | null>('posts-selected-id', () => null)

  const isInitialized = useState<boolean>('posts-initialized', () => false)
  const isLoadingList = ref(false)
  const isLoadingDetails = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref('')

  const canLoadMore = computed(() => posts.value.length < total.value)
  const selectedPost = computed(() => {
    if (!selectedPostId.value) {
      return null
    }

    return detailsCache.value[selectedPostId.value] ?? null
  })

  const selectedIndex = computed(() => {
    if (!selectedPostId.value) {
      return -1
    }

    return posts.value.findIndex((post) => post.id === selectedPostId.value)
  })

  const hasPrevPost = computed(() => selectedIndex.value > 0)
  const hasNextPost = computed(() => {
    if (selectedIndex.value === -1) {
      return false
    }

    return selectedIndex.value < posts.value.length - 1
  })

  function persistState() {
    if (!import.meta.client) {
      return
    }

    const payload: PersistedPostsState = {
      posts: posts.value,
      page: currentPage.value,
      total: total.value,
      loadedSkips: loadedSkips.value,
      overrides: overrides.value,
    }

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload))
  }

  function restoreState() {
    if (!import.meta.client) {
      return
    }

    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)

    if (!raw) {
      return
    }

    try {
      const parsed = JSON.parse(raw) as PersistedPostsState
      posts.value = parsed.posts ?? []
      currentPage.value = parsed.page ?? 1
      total.value = parsed.total ?? 0
      loadedSkips.value = parsed.loadedSkips ?? []
      overrides.value = parsed.overrides ?? {}
    }
    catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  async function fetchPage(page: number) {
    const skip = (page - 1) * PAGE_SIZE

    if (loadedSkips.value.includes(skip)) {
      currentPage.value = page
      return
    }

    isLoadingList.value = true
    errorMessage.value = ''

    try {
      const response = await $fetch<DummyPostsResponse>('/posts', {
        baseURL: BASE_URL,
        query: {
          limit: PAGE_SIZE,
          skip,
        },
      })

      const incoming = applyOverrides(response.posts.map(toPostListItem), overrides.value)
      const byId = new Map<number, PostListItem>()

      for (const post of posts.value) {
        byId.set(post.id, post)
      }

      for (const post of incoming) {
        byId.set(post.id, post)
      }

      posts.value = Array.from(byId.values()).sort((a, b) => a.id - b.id)
      total.value = response.total
      currentPage.value = page
      loadedSkips.value = [...loadedSkips.value, skip].sort((a, b) => a - b)
      persistState()
    }
    catch {
      errorMessage.value = 'Не удалось загрузить посты. Попробуйте ещё раз.'
    }
    finally {
      isLoadingList.value = false
    }
  }

  async function loadNextPage() {
    if (!canLoadMore.value || isLoadingList.value) {
      return
    }

    await fetchPage(currentPage.value + 1)
  }

  async function getPostDetails(postId: number): Promise<PostDetails | null> {
    const cached = detailsCache.value[postId]

    if (cached) {
      return cached
    }

    isLoadingDetails.value = true
    errorMessage.value = ''

    try {
      const post = await $fetch<DummyPost>(`/posts/${postId}`, {
        baseURL: BASE_URL,
      })

      const [commentsResponse, user] = await Promise.all([
        $fetch<DummyCommentsResponse>(`/posts/${postId}/comments`, {
          baseURL: BASE_URL,
        }),
        $fetch<DummyUser>(`/users/${post.userId}`, {
          baseURL: BASE_URL,
        }),
      ])

      const details = toDetails(post, user, commentsResponse.comments)
      const override = overrides.value[postId]

      if (override) {
        details.title = override.title
        details.body = override.body
      }

      detailsCache.value[postId] = details
      return details
    }
    catch {
      errorMessage.value = 'Не удалось загрузить данные поста.'
      return null
    }
    finally {
      isLoadingDetails.value = false
    }
  }

  async function openPost(postId: number) {
    selectedPostId.value = postId
    await getPostDetails(postId)
  }

  function closePost() {
    selectedPostId.value = null
    errorMessage.value = ''
  }

  async function openPrevPost() {
    if (!hasPrevPost.value) {
      return
    }

    const prevId = posts.value[selectedIndex.value - 1]?.id

    if (!prevId) {
      return
    }

    await openPost(prevId)
  }

  async function openNextPost() {
    if (!hasNextPost.value) {
      return
    }

    const nextId = posts.value[selectedIndex.value + 1]?.id

    if (!nextId) {
      return
    }

    await openPost(nextId)
  }

  async function savePost(postId: number, title: string, body: string): Promise<boolean> {
    isSaving.value = true
    errorMessage.value = ''

    try {
      const response = await $fetch<{ id: number; title: string; body: string }>(`/posts/${postId}`, {
        method: 'PATCH',
        baseURL: BASE_URL,
        body: {
          title,
          body,
        },
      })

      const nextTitle = response.title
      const nextBody = response.body

      overrides.value = {
        ...overrides.value,
        [postId]: {
          title: nextTitle,
          body: nextBody,
        },
      }

      posts.value = withPatchedPost(posts.value, postId, nextTitle, nextBody)

      const cached = detailsCache.value[postId]
      if (cached) {
        detailsCache.value[postId] = {
          ...cached,
          title: nextTitle,
          body: nextBody,
        }
      }

      persistState()
      return true
    }
    catch {
      errorMessage.value = 'Не удалось сохранить изменения поста.'
      return false
    }
    finally {
      isSaving.value = false
    }
  }

  async function init() {
    if (isInitialized.value) {
      return
    }

    restoreState()
    isInitialized.value = true

    if (posts.value.length === 0) {
      await fetchPage(1)
    }
  }

  return {
    posts,
    total,
    currentPage,
    canLoadMore,
    selectedPostId,
    selectedPost,
    hasPrevPost,
    hasNextPost,
    isLoadingList,
    isLoadingDetails,
    isSaving,
    errorMessage,
    init,
    loadNextPage,
    openPost,
    closePost,
    openPrevPost,
    openNextPost,
    savePost,
    getPostDetails,
  }
}
