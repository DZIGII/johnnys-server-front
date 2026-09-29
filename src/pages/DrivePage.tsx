import { useEffect, useState, useRef, useCallback } from "react"
import { driveApi } from "@/api/drive.api"
import { useAuth } from "@/context/AuthContext"
import type { MyDriveResponse, FolderDataResponse, FileResponseDto } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import FolderCard from "@/components/FolderCard"
import FileThumbnail from "@/components/FileThumbnail"
import DocumentViewer from "@/components/DocumentViewer"
import {
  Folder, FolderPlus, Upload, Trash2, Eye, EyeOff,
  Download, ChevronRight, HardDrive, Loader2, Image, Film, FileText, Plus,
  X, ZoomIn, LayoutGrid, List,
} from "lucide-react"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return <Image className="w-4 h-4 text-[#ff7a1a]" />
  if (mime.startsWith("video/")) return <Film className="w-4 h-4 text-purple-400" />
  return <FileText className="w-4 h-4 text-[#8a7e74]" />
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

// Breadcrumb entry — null folderId means "drive root"
type Crumb = { folderId: string | null; name: string }

// ─── Component ────────────────────────────────────────────────────────────────

export default function DrivePage() {
  const { user } = useAuth()

  // Drive root info (from GET /drive/me)
  const [drive, setDrive] = useState<MyDriveResponse | null>(null)
  // Currently open folder (null = we're at root)
  const [currentFolder, setCurrentFolder] = useState<FolderDataResponse | null>(null)
  // Breadcrumb trail
  const [breadcrumb, setBreadcrumb] = useState<Crumb[]>([])
  // true when /drive/me returned 404
  const [noDrive, setNoDrive] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // View mode — persist in localStorage
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    try {
      const saved = localStorage.getItem("driveViewMode")
      return saved === "list" ? "list" : "grid"
    } catch {
      return "grid"
    }
  })

  const toggleViewMode = () => {
    setViewMode((v) => {
      const next = v === "grid" ? "list" : "grid"
      try { localStorage.setItem("driveViewMode", next) } catch { /* ignore */ }
      return next
    })
  }

  // New folder form
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [creatingFolder, setCreatingFolder] = useState(false)

  // Create drive form (shown when noDrive)
  const [newDriveName, setNewDriveName] = useState(`${user?.firstName ?? "My"}'s Drive`)
  const [creatingDrive, setCreatingDrive] = useState(false)

  // File upload
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // File preview
  const [previewFile, setPreviewFile] = useState<FileResponseDto | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.email) return
    loadMyDrive()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function loadMyDrive() {
    setLoading(true)
    setError("")
    setNoDrive(false)
    try {
      const res = await driveApi.getMyDrive()
      setDrive(res.data)
      setCurrentFolder(null)
      setBreadcrumb([{ folderId: null, name: res.data.name }])
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        setNoDrive(true)
      } else {
        setError("Failed to load drive.")
      }
    } finally {
      setLoading(false)
    }
  }

  async function openFolder(folderId: string, name: string) {
    setLoading(true)
    try {
      const res = await driveApi.getFolderData(folderId)
      setCurrentFolder(res.data)
      setBreadcrumb((prev) => {
        const idx = prev.findIndex((c) => c.folderId === folderId)
        if (idx >= 0) return prev.slice(0, idx + 1)
        return [...prev, { folderId, name }]
      })
    } catch {
      setError("Failed to open folder.")
    } finally {
      setLoading(false)
    }
  }

  async function navigateToCrumb(crumb: Crumb) {
    if (crumb.folderId === null) {
      setCurrentFolder(null)
      setBreadcrumb([{ folderId: null, name: drive!.name }])
    } else {
      await openFolder(crumb.folderId, crumb.name)
    }
  }

  async function refreshView() {
    if (currentFolder) {
      const res = await driveApi.getFolderData(currentFolder.folderId)
      setCurrentFolder(res.data)
    } else {
      const res = await driveApi.getMyDrive()
      setDrive(res.data)
    }
  }

  // ── Preview ────────────────────────────────────────────────────────────────

  const isPreviewable = (mime: string) =>
    mime.startsWith("image/") ||
    mime.startsWith("video/") ||
    mime === "application/pdf" ||
    mime === "text/csv" ||
    mime === "application/csv" ||
    mime.includes("csv") ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword" ||
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mime === "application/vnd.ms-powerpoint"

  async function openPreview(file: FileResponseDto) {
    if (!isPreviewable(file.mime)) return
    setPreviewFile(file)
    setPreviewUrl(null)
    setPreviewBlob(null)
    setPreviewLoading(true)
    try {
      const res = await driveApi.getFileBlob(file.fileId)
      const blob = res.data
      setPreviewBlob(blob)
      if (file.mime.startsWith("image/") || file.mime.startsWith("video/")) {
        setPreviewUrl(URL.createObjectURL(blob))
      }
    } finally {
      setPreviewLoading(false)
    }
  }

  const closePreview = useCallback(() => {
    setPreviewFile(null)
    setPreviewBlob(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closePreview() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [closePreview])

  // ── Mutations ──────────────────────────────────────────────────────────────

  async function handleCreateDrive(e: React.FormEvent) {
    e.preventDefault()
    if (!newDriveName.trim()) return
    setCreatingDrive(true)
    try {
      await driveApi.createDrive({ name: newDriveName.trim(), userEmail: user!.email })
      await loadMyDrive()
    } catch {
      setError("Failed to create drive.")
    } finally {
      setCreatingDrive(false)
    }
  }

  async function createFolder() {
    if (!drive || !newFolderName.trim()) return
    setCreatingFolder(true)
    try {
      await driveApi.createFolder({
        name: newFolderName.trim(),
        parentId: currentFolder?.folderId ?? null,
        driveId: drive.driveId,
        userEmail: user!.email,
      })
      setNewFolderName("")
      setShowNewFolder(false)
      await refreshView()
    } finally {
      setCreatingFolder(false)
    }
  }

  async function deleteFolder(id: string) {
    if (!confirm("Delete this folder and all its contents?")) return
    await driveApi.deleteFolder(id)
    await refreshView()
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !currentFolder) return
    setUploading(true)
    setUploadPct(0)
    try {
      await driveApi.uploadFile(currentFolder.folderId, user!.email, file, setUploadPct)
      await refreshView()
    } finally {
      setUploading(false)
      setUploadPct(0)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function deleteFile(id: string) {
    if (!confirm("Delete this file?")) return
    await driveApi.deleteFile(id)
    await refreshView()
  }

  async function toggleVisibility(file: FileResponseDto) {
    const next = file.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC"
    await driveApi.changeVisibility(file.fileId, next, user!.email)
    await refreshView()
  }

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading && !drive && !noDrive) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="w-6 h-6 animate-spin text-[#ff7a1a]" />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "#8a7e74" }}>
        <p>{error}</p>
        <Button onClick={loadMyDrive} variant="outline">Retry</Button>
      </div>
    )
  }

  // ── No drive yet ───────────────────────────────────────────────────────────
  if (noDrive) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(255,122,26,0.1)",
              border: "1px solid rgba(255,122,26,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <HardDrive className="w-8 h-8 text-[#ff7a1a]" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#e8e3de", marginBottom: 8 }}>No drive yet</h2>
          <p style={{ fontSize: 14, color: "#a39d96", marginBottom: 24 }}>Create your personal drive to start storing files.</p>
          <form onSubmit={handleCreateDrive} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input
              value={newDriveName}
              onChange={(e) => setNewDriveName(e.target.value)}
              placeholder="Drive name…"
              required
            />
            <Button type="submit" disabled={creatingDrive} className="gap-2">
              {creatingDrive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Drive
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // ── Drive view ─────────────────────────────────────────────────────────────

  const isAtRoot = currentFolder === null
  const folders = isAtRoot ? (drive?.folders ?? []) : currentFolder.children
  const files = isAtRoot ? [] : currentFolder.files

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 56,
          borderBottom: "1px solid #1f1d1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          flexShrink: 0,
          gap: 12,
        }}
      >
        {/* Back button + Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {breadcrumb.length > 1 && (
            <button
              onClick={() => navigateToCrumb(breadcrumb[breadcrumb.length - 2])}
              title="Go back"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 7,
                border: "1px solid #221f1c",
                background: "transparent",
                color: "#a39d96",
                fontSize: 13,
                cursor: "pointer",
                flexShrink: 0,
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#e8e3de"; e.currentTarget.style.borderColor = "#3a3530" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#a39d96"; e.currentTarget.style.borderColor = "#221f1c" }}
            >
              ← Back
            </button>
          )}
          <nav style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#a39d96", flexWrap: "wrap", minWidth: 0 }}>
            {breadcrumb.map((crumb, i) => (
              <span key={crumb.folderId ?? "root"} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                <button
                  onClick={() => navigateToCrumb(crumb)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: i === breadcrumb.length - 1 ? "default" : "pointer",
                    color: i === breadcrumb.length - 1 ? "#e8e3de" : "#a39d96",
                    fontWeight: i === breadcrumb.length - 1 ? 500 : 400,
                    fontSize: 13,
                    padding: 0,
                    pointerEvents: i === breadcrumb.length - 1 ? "none" : "auto",
                  }}
                >
                  {crumb.name}
                </button>
              </span>
            ))}
            {loading && <Loader2 className="w-3 h-3 animate-spin text-[#6b665f] ml-1" />}
          </nav>
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* View toggle */}
          <button
            onClick={toggleViewMode}
            title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              background: "transparent",
              border: "1px solid #221f1c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#a39d96",
            }}
          >
            {viewMode === "grid" ? <List size={15} /> : <LayoutGrid size={15} />}
          </button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowNewFolder((v) => !v)}
          >
            <FolderPlus className="w-4 h-4" />
            New folder
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => !isAtRoot && fileInputRef.current?.click()}
            disabled={uploading || isAtRoot}
            title={isAtRoot ? "Open a folder to upload files" : undefined}
          >
            {uploading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading {uploadPct}%</>
              : <><Upload className="w-4 h-4" />Upload</>
            }
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={uploadFile} />
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 32px" }}>

        {/* New folder input */}
        {showNewFolder && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <Input
              placeholder="Folder name…"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFolder()}
              className="max-w-xs"
              autoFocus
            />
            <Button size="sm" onClick={createFolder} disabled={creatingFolder || !newFolderName.trim()}>
              {creatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowNewFolder(false); setNewFolderName("") }}>
              Cancel
            </Button>
          </div>
        )}

        {/* ── GRID VIEW ─────────────────────────────────────────────────── */}
        {viewMode === "grid" && (
          <>
            {folders.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, color: "#6b665f", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                  Folders
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 8,
                  }}
                >
                  {folders.map((f) => (
                    <FolderCard
                      key={f.folderId}
                      name={f.name}
                      onClick={() => openFolder(f.folderId, f.name)}
                      onDelete={() => deleteFolder(f.folderId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {!isAtRoot && files.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: "#6b665f", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                  Files
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 8,
                  }}
                >
                  {files.map((file) => (
                    <FileThumbnail
                      key={file.fileId}
                      fileId={file.fileId}
                      mime={file.mime}
                      name={file.name}
                      size={file.size}
                      visibility={file.visibility}
                      isPreviewable={isPreviewable(file.mime)}
                      onPreview={() => openPreview(file)}
                      onDelete={() => deleteFile(file.fileId)}
                      onToggleVisibility={() => toggleVisibility(file)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── LIST VIEW ─────────────────────────────────────────────────── */}
        {viewMode === "list" && (
          <>
            {folders.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, color: "#6b665f", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                  Folders
                </p>
                <div style={{ borderRadius: 10, border: "1px solid #221f1c", overflow: "hidden" }}>
                  {folders.map((f, i) => (
                    <div
                      key={f.folderId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        borderBottom: i < folders.length - 1 ? "1px solid #1f1d1a" : "none",
                        cursor: "pointer",
                        background: "transparent",
                        transition: "background 0.1s",
                      }}
                      className="group hover:bg-[#161412]"
                      onClick={() => openFolder(f.folderId, f.name)}
                    >
                      <Folder className="w-4 h-4 text-[#ff7a1a] shrink-0" />
                      <span style={{ flex: 1, fontSize: 14, color: "#e8e3de", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.name}
                      </span>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8a7e74] hover:text-red-400"
                        onClick={(e) => { e.stopPropagation(); deleteFolder(f.folderId) }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isAtRoot && files.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: "#6b665f", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                  Files
                </p>
                <div style={{ borderRadius: 10, border: "1px solid #221f1c", overflow: "hidden" }}>
                  {files.map((file, i) => (
                    <div
                      key={file.fileId}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        i < files.length - 1 ? "border-b border-[#1f1d1a]" : ""
                      } hover:bg-[#161412] transition-colors group`}
                    >
                      {fileIcon(file.mime)}
                      <span
                        className={`flex-1 text-sm text-[#e8e3de] truncate ${isPreviewable(file.mime) ? "cursor-pointer hover:text-[#ff7a1a] transition-colors" : ""}`}
                        onClick={() => isPreviewable(file.mime) && openPreview(file)}
                        title={isPreviewable(file.mime) ? "Click to preview" : undefined}
                      >
                        {file.name}
                      </span>
                      <span style={{ fontSize: 12, color: "#6b665f" }}>{formatBytes(file.size)}</span>
                      <Badge variant={file.visibility === "PUBLIC" ? "default" : "secondary"}>
                        {file.visibility}
                      </Badge>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isPreviewable(file.mime) && (
                          <button title="Preview" className="text-[#8a7e74] hover:text-[#ff7a1a] p-1" onClick={() => openPreview(file)}>
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        )}
                        <button title="Toggle visibility" className="text-[#8a7e74] hover:text-[#ff7a1a] p-1" onClick={() => toggleVisibility(file)}>
                          {file.visibility === "PUBLIC" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <a
                          href={driveApi.getDownloadUrl(file.fileId)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#8a7e74] hover:text-[#ff7a1a] p-1"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button title="Delete file" className="text-[#8a7e74] hover:text-red-400 p-1" onClick={() => deleteFile(file.fileId)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {folders.length === 0 && (isAtRoot || files.length === 0) && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12, color: "#a39d96" }}>
            <HardDrive size={40} style={{ opacity: 0.25 }} />
            <p style={{ fontSize: 14, margin: 0 }}>{isAtRoot ? "No folders yet" : "This folder is empty"}</p>
            {!isAtRoot && (
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1.5" /> Upload first file
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Preview modal ──────────────────────────────────────────────────── */}
      {previewFile && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2 min-w-0">
                {fileIcon(previewFile.mime)}
                <span className="text-sm text-[#e8e3de] truncate">{previewFile.name}</span>
                <span className="text-xs text-[#a39d96] shrink-0">{formatBytes(previewFile.size)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <a
                  href={driveApi.getDownloadUrl(previewFile.fileId)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#a39d96] hover:text-[#ff7a1a] p-1 transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={closePreview}
                  className="text-[#a39d96] hover:text-[#e8e3de] p-1 transition-colors"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            {previewLoading ? (
              <div className="flex items-center justify-center rounded-xl bg-[#181614] border border-[#221f1c] min-h-48">
                <Loader2 className="w-8 h-8 animate-spin text-[#ff7a1a]" />
              </div>
            ) : previewUrl && previewFile.mime.startsWith("image/") ? (
              <div className="flex items-center justify-center rounded-xl overflow-hidden bg-[#181614] border border-[#221f1c]">
                <img
                  src={previewUrl}
                  alt={previewFile.name}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>
            ) : previewUrl && previewFile.mime.startsWith("video/") ? (
              <div className="flex items-center justify-center rounded-xl overflow-hidden bg-[#181614] border border-[#221f1c]">
                <video
                  src={previewUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-[80vh] rounded-xl"
                  style={{ background: "#000" }}
                />
              </div>
            ) : previewBlob && !previewFile.mime.startsWith("image/") && !previewFile.mime.startsWith("video/") ? (
              <DocumentViewer
                blob={previewBlob}
                mime={previewFile.mime}
                fileName={previewFile.name}
                downloadUrl={driveApi.getDownloadUrl(previewFile.fileId)}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
