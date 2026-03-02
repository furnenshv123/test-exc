<template>
  <div class="min-h-screen bg-background">
    <header class="border-b sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
      <div class="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center gap-3 justify-between">
        <h1 class="text-2xl font-bold tracking-tight">Лента постов</h1>
        <Badge variant="secondary">{{ filteredPosts.length }} из {{ total }}</Badge>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <Card>
        <CardHeader class="space-y-2">
          <CardTitle class="text-base">Поиск</CardTitle>
          <div class="flex items-center gap-2">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Введите текст для поиска по заголовку, тексту и реакциям"
              class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
            <Button size="sm" variant="ghost" @click="resetSearch">Сбросить</Button>
          </div>
        </CardHeader>
      </Card>

      <div class="grid grid-cols-1 gap-4">
        <Card
          v-for="post in filteredPosts"
          :key="post.id"
          class="cursor-pointer hover:bg-muted/20 transition-colors"
          @click="openPost(post.id)"
        >
          <CardHeader class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <CardTitle class="text-lg leading-tight">{{ post.title }}</CardTitle>
              <Badge variant="outline">Реакции: {{ post.reactions }}</Badge>
            </div>
            <p class="text-sm text-muted-foreground leading-relaxed">
              {{ truncateBody(post.body) }}
            </p>
          </CardHeader>
        </Card>
      </div>

      <Card v-if="!isLoadingList && filteredPosts.length === 0">
        <CardContent class="p-4 text-sm text-muted-foreground">
          По вашему запросу ничего не найдено.
        </CardContent>
      </Card>

      <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>

      <div class="flex justify-center">
        <Button
          v-if="canLoadMore"
          :disabled="isLoadingList"
          variant="outline"
          @click="loadNextPage"
        >
          {{ isLoadingList ? 'Загрузка...' : 'Показать ещё посты' }}
        </Button>
      </div>
    </main>

    <PostModal
      :open="Boolean(selectedPostId)"
      :post="selectedPost"
      :loading="isLoadingDetails"
      :saving="isSaving"
      :has-prev="hasPrevPost"
      :has-next="hasNextPost"
      @close="closePost"
      @prev="openPrevPost"
      @next="openNextPost"
      @save="handleSave"
    />
  </div>
</template>

<script lang="ts" setup>
import { truncateBody } from '~/lib/post-utils'

const {
  posts,
  total,
  selectedPostId,
  selectedPost,
  canLoadMore,
  hasPrevPost,
  hasNextPost,
  isLoadingList,
  isLoadingDetails,
  isSaving,
  errorMessage,
  init,
  openPost,
  closePost,
  openPrevPost,
  openNextPost,
  loadNextPage,
  savePost,
} = usePosts()

const searchQuery = ref('')

const filteredPosts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return posts.value
  }

  return posts.value.filter((post) => {
    const reactions = String(post.reactions)
    return (
      post.title.toLowerCase().includes(query)
      || post.body.toLowerCase().includes(query)
      || reactions.includes(query)
    )
  })
})

onMounted(async () => {
  await init()
})

function resetSearch() {
  searchQuery.value = ''
}

async function handleSave(payload: { title: string; body: string }) {
  if (!selectedPostId.value) {
    return
  }

  await savePost(selectedPostId.value, payload.title, payload.body)
}
</script>