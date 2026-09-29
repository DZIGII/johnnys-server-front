import { apiClient } from "./client"
import type {
  DriveCreateDto,
  FolderCreateDto,
  MyDriveResponse,
  FolderDataResponse,
  GalleryItem,
  Visibility,
} from "./types"

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

export const driveApi = {
  // POST /drive
  createDrive: (data: DriveCreateDto) =>
    apiClient.post<{ driveId: string; name: string }>("/drive", data),

  // GET /drive/me  →  { driveId, name, folders[] }  |  404 { error: "No drive" }
  getMyDrive: () =>
    apiClient.get<MyDriveResponse>("/drive/me"),

  // GET /drive/folders/:folderId  →  { folderId, name, parentId, children[], files[] }
  getFolderData: (folderId: string) =>
    apiClient.get<FolderDataResponse>(`/drive/folders/${folderId}`),

  // GET /drive/gallery
  getGallery: () =>
    apiClient.get<GalleryItem[]>("/drive/gallery"),

  // POST /drive/folders
  createFolder: (data: FolderCreateDto) =>
    apiClient.post<{ folderId: string; name: string }>("/drive/folders", data),

  // DELETE /drive/folders/:id
  deleteFolder: (id: string) =>
    apiClient.delete(`/drive/folders/${id}`),

  // POST /drive/files  (multipart)
  uploadFile: (folderId: string, userEmail: string, file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData()
    form.append("file", file)
    form.append("folderId", folderId)
    form.append("userEmail", userEmail)
    return apiClient.post("/drive/files", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
      },
    })
  },

  // DELETE /drive/files/:id
  deleteFile: (id: string) =>
    apiClient.delete(`/drive/files/${id}`),

  // PATCH /drive/files/:id/visibility
  changeVisibility: (id: string, visibility: Visibility, userEmail: string) =>
    apiClient.patch(`/drive/files/${id}/visibility`, { visibility, userEmail }),

  // Fetch file as Blob (auth header included → works for PRIVATE files too)
  getFileBlob: (fileId: string) =>
    apiClient.get<Blob>(`/drive/files/${fileId}/download`, { responseType: "blob" }),

  // Direct download URL (no axios needed — public files only)
  getDownloadUrl: (fileId: string) =>
    `${BASE_URL}/drive/files/${fileId}/download`,
}
