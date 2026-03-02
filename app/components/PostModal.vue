<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="emit('close')"
  >
    <Card class="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
      <CardHeader class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <CardTitle>Детали поста</CardTitle>
          <Button variant="ghost" size="sm" @click="emit('close')">Закрыть</Button>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" :disabled="!hasPrev" @click="emit('prev')">
            Предыдущий пост
          </Button>
          <Button size="sm" variant="outline" :disabled="!hasNext" @click="emit('next')">
            Следующий пост
          </Button>
          <Button size="sm" variant="secondary" :disabled="loading || saving" @click="startEdit">
            Редактировать
          </Button>
          <Button
            v-if="isEditing && isDirty"
            size="sm"
            :disabled="saving"
            @click="onSave"
          >
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </Button>
        </div>
      </CardHeader>

      <CardContent class="overflow-y-auto space-y-4 pb-6">
        <p v-if="loading" class="text-sm text-muted-foreground">Загрузка данных поста...</p>

        <template v-else-if="post">
          <div class="space-y-2">
            <p class="text-xs text-muted-foreground">Заголовок</p>
            <input
              v-model="editableTitle"
              :disabled="!isEditing"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              type="text"
            >
          </div>

          <div class="space-y-2">
            <p class="text-xs text-muted-foreground">Текст</p>
            <Textarea
              v-model="editableBody"
              :disabled="!isEditing"
              class="min-h-[160px]"
            />
          </div>

          <div class="rounded-md border border-border p-3 text-sm space-y-1">
            <p><span class="font-medium">Автор:</span> {{ post.user.fullName }} (@{{ post.user.username }})</p>
            <p><span class="font-medium">Должность:</span> {{ post.user.title }}</p>
            <p><span class="font-medium">Отдел:</span> {{ post.user.department }}</p>
            <p><span class="font-medium">Реакции:</span> {{ post.reactions }}</p>
          </div>

          <div class="space-y-2">
            <p class="text-xs text-muted-foreground">Теги</p>
            <div class="flex flex-wrap gap-2">
              <Badge v-for="tag in post.tags" :key="tag" variant="outline">{{ tag }}</Badge>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-xs text-muted-foreground">Комментарии ({{ post.comments.length }})</p>
            <div class="space-y-2">
              <div v-for="comment in post.comments" :key="comment.id" class="rounded-md border border-border p-3 text-sm">
                <p class="text-foreground/90">{{ comment.body }}</p>
                <p class="mt-1 text-xs text-muted-foreground">@{{ comment.username }} · Лайки: {{ comment.likes }}</p>
              </div>
            </div>
          </div>
        </template>

        <p v-else class="text-sm text-muted-foreground">Данные не найдены.</p>
      </CardContent>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import type { PostDetails } from '~/types/dummyjson'

const props = defineProps<{
  open: boolean
  post: PostDetails | null
  loading: boolean
  saving: boolean
  hasPrev: boolean
  hasNext: boolean
}>()

const emit = defineEmits<{
  close: []
  prev: []
  next: []
  save: [payload: { title: string; body: string }]
}>()

const isEditing = ref(false)
const editableTitle = ref('')
const editableBody = ref('')

const isDirty = computed(() => {
  if (!props.post) {
    return false
  }

  return editableTitle.value !== props.post.title || editableBody.value !== props.post.body
})

watch(() => props.post, (post) => {
  editableTitle.value = post?.title ?? ''
  editableBody.value = post?.body ?? ''
  isEditing.value = false
}, { immediate: true })

function startEdit() {
  if (!props.post) {
    return
  }

  isEditing.value = true
}

function onSave() {
  if (!props.post || !isDirty.value) {
    return
  }

  emit('save', {
    title: editableTitle.value,
    body: editableBody.value,
  })
}
</script>
