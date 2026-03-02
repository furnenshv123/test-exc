import type { DummyPost, MatchMode, PostListItem, PostOverrides } from '~/types/dummyjson'

export interface SearchFilters {
  title: string
  body: string
  userId: string
  reactions: string
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  title: '',
  body: '',
  userId: '',
  reactions: '',
}

export function getReactionCount(reactions: DummyPost['reactions']): number {
  if (typeof reactions === 'number') {
    return reactions
  }

  if (typeof reactions?.likes === 'number') {
    return reactions.likes
  }

  return 0
}

export function toPostListItem(post: DummyPost): PostListItem {
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    userId: post.userId,
    reactions: getReactionCount(post.reactions),
  }
}

export function truncateBody(body: string, maxLength = 100): string {
  if (body.length <= maxLength) {
    return body
  }

  return `${body.slice(0, maxLength)}...`
}

export function applyOverrides(posts: PostListItem[], overrides: PostOverrides): PostListItem[] {
  return posts.map((post) => {
    const override = overrides[post.id]

    if (!override) {
      return post
    }

    return {
      ...post,
      title: override.title,
      body: override.body,
    }
  })
}

export function withPatchedPost(posts: PostListItem[], postId: number, title: string, body: string): PostListItem[] {
  return posts.map((post) => {
    if (post.id !== postId) {
      return post
    }

    return {
      ...post,
      title,
      body,
    }
  })
}

function matchValue(value: string | number, query: string, mode: MatchMode): boolean {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  const source = String(value).toLowerCase()

  if (mode === 'exact') {
    return source === normalizedQuery
  }

  return source.includes(normalizedQuery)
}

export function filterPosts(posts: PostListItem[], filters: SearchFilters, mode: MatchMode): PostListItem[] {
  return posts.filter((post) => {
    return (
      matchValue(post.title, filters.title, mode)
      && matchValue(post.body, filters.body, mode)
      && matchValue(post.userId, filters.userId, mode)
      && matchValue(post.reactions, filters.reactions, mode)
    )
  })
}
