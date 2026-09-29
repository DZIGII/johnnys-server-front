import { useEffect, useRef, useState } from "react"
import { driveApi } from "@/api/drive.api"
import { Play, ZoomIn, Download, Trash2, Eye, EyeOff, FileText, ExternalLink } from "lucide-react"

interface Props {
  fileId: string
  mime: string
  name: string
  size: number
  onPreview: () => void
  onDelete: () => void
  onToggleVisibility: () => void
  visibility: "PUBLIC" | "PRIVATE"
  isPreviewable?: boolean
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileThumbnail({
  fileId,
  mime,
  name,
  size,
  onPreview,
  onDelete,
  onToggleVisibility,
  visibility,
  isPreviewable = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)

  const isImage = mime.startsWith("image/")
  const isVideo = mime.startsWith("video/")
  const isMedia = isImage || isVideo

  useEffect(() => {
    if (!isMedia) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !blobUrl && !loading) {
          setLoading(true)
          driveApi
            .getFileBlob(fileId)
            .then((res) => {
              const url = URL.createObjectURL(res.data)
              setBlobUrl(url)
            })
            .catch(() => {
              // silently fail — will show placeholder
            })
            .finally(() => setLoading(false))
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (rootRef.current) observer.observe(rootRef.current)

    return () => observer.disconnect()
  }, [fileId, isMedia, blobUrl, loading])

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? "rgba(255,122,26,0.2)" : "#221f1c"}`,
        borderRadius: 12,
        background: hovered ? "#161412" : "#121110",
        transition: "border-color 0.15s, background 0.15s",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top media / icon area */}
      <div
        style={{
          aspectRatio: "4/3",
          background: "#0f0e0d",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg, #1a1816 25%, #221f1c 50%, #1a1816 75%)",
              backgroundSize: "200% 100%",
              animation: "pulse-shimmer 1.5s ease-in-out infinite",
            }}
          />
        )}

        {isImage && blobUrl && (
          <img
            src={blobUrl}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
          />
        )}

        {isVideo && blobUrl && (
          <video
            src={blobUrl}
            preload="metadata"
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
          />
        )}

        {!isMedia && !loading && (
          <FileText size={40} color="#6b665f" />
        )}

        {isMedia && !blobUrl && !loading && (
          <FileText size={40} color="#6b665f" />
        )}

        {/* Video play overlay */}
        {isVideo && blobUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Play size={16} color="#fff" style={{ marginLeft: 2 }} />
            </div>
          </div>
        )}

        {/* Hover overlay with action buttons */}
        {hovered && isMedia && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <ActionBtn title="Preview" onClick={onPreview}>
              <ZoomIn size={15} />
            </ActionBtn>
            <ActionBtn title="Download" href={driveApi.getDownloadUrl(fileId)}>
              <Download size={15} />
            </ActionBtn>
            <ActionBtn title="Toggle visibility" onClick={onToggleVisibility}>
              {visibility === "PUBLIC" ? <EyeOff size={15} /> : <Eye size={15} />}
            </ActionBtn>
            <ActionBtn title="Delete" onClick={onDelete} danger>
              <Trash2 size={15} />
            </ActionBtn>
          </div>
        )}

        {/* Non-media hover overlay */}
        {hovered && !isMedia && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              gap: 4,
            }}
          >
            {isPreviewable && (
              <ActionBtn title="Open" onClick={onPreview}>
                <ExternalLink size={13} />
              </ActionBtn>
            )}
            <ActionBtn title="Download" href={driveApi.getDownloadUrl(fileId)}>
              <Download size={13} />
            </ActionBtn>
            <ActionBtn title="Toggle visibility" onClick={onToggleVisibility}>
              {visibility === "PUBLIC" ? <EyeOff size={13} /> : <Eye size={13} />}
            </ActionBtn>
            <ActionBtn title="Delete" onClick={onDelete} danger>
              <Trash2 size={13} />
            </ActionBtn>
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div
        onClick={isMedia || isPreviewable ? onPreview : undefined}
        style={{
          padding: 14,
          borderTop: "1px solid #1f1d1a",
          cursor: isMedia || isPreviewable ? "pointer" : "default",
        }}
      >
        <p
          style={{
            fontSize: 13,
            color: "#e8e3de",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </p>
        <p style={{ fontSize: 11, color: "#a39d96", margin: "3px 0 0", lineHeight: 1 }}>
          {formatBytes(size)}
        </p>
      </div>

      <style>{`
        @keyframes pulse-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

interface ActionBtnProps {
  title: string
  onClick?: () => void
  href?: string
  danger?: boolean
  children: React.ReactNode
}

function ActionBtn({ title, onClick, href, danger, children }: ActionBtnProps) {
  const base: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 7,
    background: "rgba(15,14,13,0.85)",
    border: "1px solid #221f1c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: danger ? "#f87171" : "#e8e3de",
    textDecoration: "none",
    flexShrink: 0,
  }

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" title={title} style={base}>
        {children}
      </a>
    )
  }

  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      style={base}
    >
      {children}
    </button>
  )
}
