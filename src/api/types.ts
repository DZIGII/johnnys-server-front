// ─── User DTOs ────────────────────────────────────────────────────────────────

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN"

export interface RegisterDto {
  firstName: string
  lastName: string
  nickname: string
  email: string
  password: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface VerifyDto {
  email: string
  code: string
}

// Matches toUserResponseDto on the backend (note: nickName with capital N)
export interface UserDto {
  firstName: string
  lastName: string
  email: string
  nickName: string   // backend returns nickName (capital N), not nickname
  // role and enabled are NOT returned by toUserResponseDto
  // add them here if/when backend includes them in the login response
  role?: UserRole
  enabled?: boolean
}

export interface EnableDisableDto {
  email: string
}

export interface FilterUsersQuery {
  email?: string
  firstName?: string
  lastName?: string
  nickname?: string
  role?: UserRole
  page?: number
  limit?: number
}

// ─── Auth response ────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string
  user: UserDto
}

// ─── Drive DTOs ───────────────────────────────────────────────────────────────

export interface DriveCreateDto {
  name: string
  userEmail: string
}

export interface FolderCreateDto {
  name: string
  parentId: string | null
  driveId: string | null
  userEmail: string
}

export interface FileResponseDto {
  fileId: string
  name: string
  visibility: "PUBLIC" | "PRIVATE"
  mime: string
  size: number
  width: number | null
  height: number | null
  capturedAt: string | null
}

// GET /drive/me
export interface MyDriveResponse {
  driveId: string
  name: string
  folders: { folderId: string; name: string }[]
}

// GET /drive/folders/:folderId
export interface FolderDataResponse {
  folderId: string
  name: string
  parentId: string | null
  children: { folderId: string; name: string }[]
  files: FileResponseDto[]
}

export interface GalleryItem {
  fileId: string
  name: string
  mime: string
  width: number | null
  height: number | null
  capturedAt: string | null
  driveId: string
}

export type Visibility = "PUBLIC" | "PRIVATE"
