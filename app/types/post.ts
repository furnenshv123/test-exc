import type { Author } from './author'

export interface Post {
  id: number
  title: string
  body: string
  author: Author
  date: string
  tags: string[]
  commentCount: number
  readMinutes: number
}
