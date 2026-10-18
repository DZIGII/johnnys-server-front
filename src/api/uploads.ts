const API = import.meta.env.VITE_API_URL ?? ""
const BASE = `${API}/drive/uploads`

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? res.statusText)
  return res.status === 204 ? (undefined as T) : res.json()
}

export const initUpload = (data: { folderId: string; name: string; mime: string; size: number }) =>
  request<{ uploadId: string; chunkSize: number; totalChunks: number }>("POST", BASE, data)

export const getUploadStatus = (uploadId: string) =>
  request<{ receivedChunks: number; totalChunks: number }>("GET", `${BASE}/${uploadId}`)

export const completeUpload = (uploadId: string) =>
  request("POST", `${BASE}/${uploadId}/complete`)

export const cancelUpload = (uploadId: string) =>
  request("DELETE", `${BASE}/${uploadId}`)

export function uploadChunk(
  uploadId: string,
  index: number,
  chunk: Blob,
  onProgress: (loaded: number) => void,
  onXhr: (xhr: XMLHttpRequest) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", `${BASE}/${uploadId}/chunks/${index}`)
    xhr.withCredentials = true
    Object.entries(authHeaders()).forEach(([k, v]) => xhr.setRequestHeader(k, v))

    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.min(e.loaded, chunk.size))
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText || "Chunk failed")))
    xhr.onerror = () => reject(new Error("Network error"))
    xhr.onabort = () => reject(new Error("Canceled"))

    const form = new FormData()
    form.append("chunk", chunk)
    onXhr(xhr)
    xhr.send(form)
  })
}
