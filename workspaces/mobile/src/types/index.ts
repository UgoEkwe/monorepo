export interface Entity {
  id: string
  name: string
  description: string | null
  status: string
  metadata: any
  createdAt: string
  updatedAt: string
  project: {
    id: string
    name: string
  }
}

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}