import type { Author } from './author'

export interface Comment {
  id: number
  postId: number
  author: Author
  body: string
  date: string
  likes: number
}
