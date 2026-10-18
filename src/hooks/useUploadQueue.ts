import { useCallback, useEffect, useRef, useState } from "react"
import { cancelUpload, completeUpload, getUploadStatus, initUpload, uploadChunk } from "../api/uploads"

export type UploadStatus = "queued" | "uploading" | "processing" | "done" | "error" | "canceled"

export interface UploadItem {
  id: string
  file: File
  folderId: string
  status: UploadStatus
  progress: number // 0..1
  error?: string
}

const MAX_RETRIES = 3
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function useUploadQueue(onUploaded?: () => void) {
  const [items, setItems] = useState<UploadItem[]>([])
  const running = useRef(false)
  const active = useRef<{
    id: string
    uploadId?: string
    xhr?: XMLHttpRequest
    canceled: boolean
  } | null>(null)

  const update = (id: string, patch: Partial<UploadItem>) =>
    setItems((s) => s.map((i) => (i.id === id ? { ...i, ...patch } : i)))

  const add = useCallback((files: FileList | File[], folderId: string) => {
    const next: UploadItem[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      folderId,
      status: "queued",
      progress: 0,
    }))
    setItems((s) => [...s, ...next])
  }, [])

  const cancel = useCallback((id: string) => {
    if (active.current?.id === id) {
      active.current.canceled = true
      active.current.xhr?.abort()
    } else {
      setItems((s) =>
        s.map((i) => (i.id === id && i.status === "queued" ? { ...i, status: "canceled" } : i)),
      )
    }
  }, [])

  const clearFinished = useCallback(() => {
    setItems((s) =>
      s.filter(
        (i) => i.status === "queued" || i.status === "uploading" || i.status === "processing",
      ),
    )
  }, [])

  const process = async (item: UploadItem) => {
    const ctx: {
      id: string
      uploadId?: string
      xhr?: XMLHttpRequest
      canceled: boolean
    } = { id: item.id, canceled: false }
    active.current = ctx

    try {
      update(item.id, { status: "uploading", progress: 0 })

      const { uploadId, chunkSize, totalChunks } = await initUpload({
        folderId: item.folderId,
        name: item.file.name,
        mime: item.file.type || "application/octet-stream",
        size: item.file.size,
      })
      ctx.uploadId = uploadId

      let index = 0
      let retries = 0

      while (index < totalChunks) {
        if (ctx.canceled) throw new Error("Canceled")

        const start = index * chunkSize
        const chunk = item.file.slice(start, start + chunkSize)

        try {
          await uploadChunk(
            uploadId,
            index,
            chunk,
            (loaded) => update(item.id, { progress: (start + loaded) / item.file.size }),
            (xhr) => (ctx.xhr = xhr),
          )
          index++
          retries = 0
        } catch (e) {
          if (ctx.canceled || ++retries > MAX_RETRIES) throw e
          await sleep(1000 * 2 ** retries)
          index = (await getUploadStatus(uploadId)).receivedChunks
        }
      }

      update(item.id, { status: "processing", progress: 1 })
      await completeUpload(uploadId)
      update(item.id, { status: "done" })
      onUploaded?.()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      if (ctx.uploadId) cancelUpload(ctx.uploadId).catch(() => {})
      update(item.id, ctx.canceled ? { status: "canceled" } : { status: "error", error: msg })
    } finally {
      active.current = null
    }
  }

  // queue: jedan po jedan
  useEffect(() => {
    if (running.current) return
    const next = items.find((i) => i.status === "queued")
    if (!next) return

    running.current = true
    process(next).finally(() => {
      running.current = false
      setItems((s) => [...s])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const isBusy = items.some(
    (i) => i.status === "queued" || i.status === "uploading" || i.status === "processing",
  )

  // upozori pre zatvaranja taba dok traje upload
  useEffect(() => {
    if (!isBusy) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isBusy])

  const current = items.find((i) => i.status === "uploading" || i.status === "processing")
  const total = items.filter((i) => i.status !== "canceled").length
  const doneCount = items.filter((i) => i.status === "done").length

  return { items, add, cancel, clearFinished, current, total, doneCount, isBusy }
}
