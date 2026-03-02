export type MatchMode = 'partial' | 'exact'

export interface DummyPost {
  id: number
  title: string
  body: string
  userId: number
  reactions: number | { likes: number; dislikes: number }
  tags: string[]
}

export interface DummyPostsResponse {
  posts: DummyPost[]
  total: number
  skip: number
  limit: number
}

export interface DummyComment {
  id: number
  body: string
  postId: number
  likes: number
  user: {
    id: number
    username: string
    fullName?: string
  }
}

export interface DummyCommentsResponse {
  comments: DummyComment[]
  total: number
  skip: number
  limit: number
}

export interface DummyUser {
  id: number
  firstName: string
  lastName: string
  maidenName?: string
  username: string
  company?: {
    title?: string
    department?: string
  }
}

export interface PostListItem {
  id: number
  title: string
  body: string
  userId: number
  reactions: number
}

export interface PostCommentView {
  id: number
  body: string
  username: string
  likes: number
}

export interface PostDetails extends PostListItem {
  tags: string[]
  comments: PostCommentView[]
  user: {
    fullName: string
    username: string
    title: string
    department: string
  }
}

export interface PostOverrides {
  [postId: number]: {
    title: string
    body: string
  }
}

export interface PersistedPostsState {
  posts: PostListItem[]
  page: number
  total: number
  loadedSkips: number[]
  overrides: PostOverrides
}
