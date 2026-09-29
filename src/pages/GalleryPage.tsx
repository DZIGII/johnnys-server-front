import { useCallback, useEffect, useRef, useState } from "react"
import { driveApi } from "@/api/drive.api"
import type { GalleryItem } from "@/api/types"
import { Loader2, Image as ImageIcon, Download, X, Play, ChevronLeft, ChevronRight } from "lucide-react"

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupByMonth(items: GalleryItem[]): Array<{ label: string; count: string; items: GalleryItem[] }> {
  const map = new Map<string, GalleryItem[]>()
  for (const item of items) {
    const label = item.capturedAt
      ? new Date(item.capturedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "Unknown date"
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(item)
  }
  return [...map.entries()].map(([label, items]) => ({
    label,
    count: `${items.length} item${items.length !== 1 ? "s" : ""}`,
    items,
  }))
}

// Distribute items into N columns round-robin (like Pinterest)
function toCols<T>(items: T[], n: number): T[][] {
  const cols: T[][] = Array.from({ length: n }, () => [])
  items.forEach((item, i) => cols[i % n].push(item))
  return cols
}

// ── Single gallery image with lazy blob loading ───────────────────────────────

interface GalleryImgProps {
  item: GalleryItem
  onOpen: (blobUrl: string | null) => void
}

function GalleryImg({ item, onOpen }: GalleryImgProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loadState, setLoadState] = useState<"idle" | "loading" | "done" | "error">("idle")

  const isVideo = item.mime.startsWith("video/")
  const ar = item.width && item.height ? item.width / item.height : 1

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && loadState === "idle") {
          setLoadState("loading")
          driveApi
            .getFileBlob(item.fileId)
            .then((res) => {
              const url = URL.createObjectURL(res.data)
              setBlobUrl(url)
              setLoadState("done")
            })
            .catch(() => setLoadState("error"))
          observer.disconnect()
        }
      },
      { threshold: 0.05 }
    )
    if (btnRef.current) observer.observe(btnRef.current)
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.fileId])

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  return (
    <button
      ref={btnRef}
      onClick={() => onOpen(blobUrl)}
      aria-label={item.name}
      style={{
        position: "relative",
        display: "block",
        width: "100%",
        aspectRatio: String(ar),
        padding: 0,
        border: "none",
        borderRadius: 10,
        overflow: "hidden",
        background: "#161412",
        cursor: "zoom-in",
        transition: "box-shadow 0.15s",
        marginBottom: 6,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 0 2px #ff7a1a" }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none" }}
    >
      {/* Shimmer skeleton */}
      {(loadState === "idle" || loadState === "loading") && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, #1a1816 25%, #221f1c 50%, #1a1816 75%)",
            backgroundSize: "200% 100%",
            animation: "galleryPulse 1.4s ease-in-out infinite",
          }}
        />
      )}

      {/* Loaded image */}
      {blobUrl && !isVideo && (
        <img
          src={blobUrl}
          alt={item.name}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            animation: "galleryFade 0.4s ease both",
          }}
        />
      )}

      {/* Loaded video (poster frame) */}
      {blobUrl && isVideo && (
        <video
          src={blobUrl}
          preload="metadata"
          muted
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            animation: "galleryFade 0.4s ease both",
          }}
        />
      )}

      {/* Bottom label overlay */}
      {loadState === "done" && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            padding: "8px 10px",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10,
              color: "#77716a",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "80%",
            }}
          >
            {item.name}
          </span>
        </span>
      )}

      {/* Video badge */}
      {isVideo && loadState === "done" && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            alignItems: "center",
            gap: 4,
            height: 22,
            padding: "0 7px",
            borderRadius: 6,
            background: "rgba(13,12,11,0.8)",
            color: "#f3f0ec",
            fontSize: 11,
            fontFamily: "'Geist Mono', monospace",
            pointerEvents: "none",
          }}
        >
          <Play style={{ width: 9, height: 9, fill: "currentColor" }} />
          Video
        </span>
      )}
    </button>
  )
}

// ── Main gallery page ─────────────────────────────────────────────────────────

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [selectedBlobUrl, setSelectedBlobUrl] = useState<string | null>(null)
  const [lightboxLoading, setLightboxLoading] = useState(false)

  // Zoom / pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const imgRef = useRef<HTMLImageElement>(null)

  // Number of columns — could be made responsive with ResizeObserver; 4 is fine for desktop
  const COL_COUNT = 4

  const selected = selectedIndex !== null ? items[selectedIndex] : null

  useEffect(() => {
    driveApi
      .getGallery()
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false))
  }, [])

  function resetZoom() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  function fetchBlob(item: GalleryItem, existingUrl: string | null) {
    resetZoom()
    if (existingUrl) {
      setSelectedBlobUrl(existingUrl)
      return
    }
    setLightboxLoading(true)
    setSelectedBlobUrl(null)
    driveApi
      .getFileBlob(item.fileId)
      .then((res) => setSelectedBlobUrl(URL.createObjectURL(res.data)))
      .catch(() => {})
      .finally(() => setLightboxLoading(false))
  }

  function openLightbox(index: number, blobUrl: string | null) {
    setSelectedIndex(index)
    fetchBlob(items[index], blobUrl)
  }

  const navigate = useCallback((delta: number) => {
    setSelectedIndex((prev) => {
      if (prev === null) return prev
      const next = (prev + delta + items.length) % items.length
      fetchBlob(items[next], null)
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  function closeLightbox() {
    setSelectedIndex(null)
    setSelectedBlobUrl(null)
    resetZoom()
  }

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (zoom > 1) resetZoom(); else closeLightbox() }
      if (e.key === "ArrowRight" && zoom === 1) navigate(1)
      if (e.key === "ArrowLeft" && zoom === 1) navigate(-1)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, zoom])

  // Scroll wheel → zoom towards cursor
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
    setZoom((prev) => {
      const next = Math.min(Math.max(prev * factor, 1), 6)
      if (next <= 1) { setPan({ x: 0, y: 0 }); return 1 }
      // Zoom towards mouse position relative to container center
      const rect = e.currentTarget.getBoundingClientRect()
      const cx = e.clientX - rect.left - rect.width / 2
      const cy = e.clientY - rect.top - rect.height / 2
      setPan((p) => ({
        x: cx + (p.x - cx) * (next / prev),
        y: cy + (p.y - cy) * (next / prev),
      }))
      return next
    })
  }

  // Drag to pan
  function handleMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return
    e.preventDefault()
    setDragging(true)
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging) return
    setPan({
      x: dragOrigin.current.px + (e.clientX - dragOrigin.current.mx),
      y: dragOrigin.current.py + (e.clientY - dragOrigin.current.my),
    })
  }

  function handleMouseUp() {
    setDragging(false)
  }

  // Double-click → toggle 2x / reset
  function handleDblClick(e: React.MouseEvent<HTMLDivElement>) {
    if (zoom > 1) {
      resetZoom()
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      const cx = e.clientX - rect.left - rect.width / 2
      const cy = e.clientY - rect.top - rect.height / 2
      setZoom(2.5)
      setPan({ x: -cx * 1.5, y: -cy * 1.5 })
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 24, height: 24, color: "#ff7a1a", animation: "spin 1s linear infinite" }} />
      </div>
    )
  }

  const groups = groupByMonth(items)

  return (
    <div style={{ minHeight: "100vh", background: "#0d0c0b", paddingBottom: 64 }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(16px, 3vw, 40px)" }}>

        {/* Header */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
            paddingTop: "clamp(20px, 3vw, 40px)",
            paddingBottom: 8,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h1 style={{ margin: 0, fontSize: "clamp(22px, 2.4vw, 28px)", fontWeight: 600, letterSpacing: "-0.03em", color: "#f3f0ec" }}>
              Gallery
            </h1>
            <p style={{ margin: 0, color: "#a39d96", fontSize: 14 }}>
              Every photo and video in your drive, newest first.
            </p>
          </div>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#6b665f" }}>
            {items.length} items
          </span>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div
            style={{
              marginTop: 24,
              minHeight: 360,
              border: "1.5px dashed #2e2a26",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "40px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#171513",
                border: "1px solid #2a2724",
                color: "#ff7a1a",
                display: "grid",
                placeItems: "center",
                marginBottom: 6,
              }}
            >
              <ImageIcon style={{ width: 24, height: 24 }} />
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#f3f0ec" }}>No photos or videos yet</h2>
            <p style={{ margin: 0, maxWidth: "24rem", color: "#a39d96", fontSize: 14, lineHeight: 1.55 }}>
              Upload images or videos to your drive and they'll show up here automatically.
            </p>
          </div>
        )}

        {/* Groups */}
        {groups.map((group) => {
          const cols = toCols(group.items, COL_COUNT)
          return (
            <section key={group.label}>
              {/* Sticky date header */}
              <div
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 5,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  padding: "18px 0 12px",
                  background: "rgba(13,12,11,0.88)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", color: "#f3f0ec" }}>
                  {group.label}
                </h2>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#6b665f" }}>
                  {group.count}
                </span>
              </div>

              {/* Masonry columns */}
              <div style={{ display: "flex", gap: 6, alignItems: "flex-start", paddingBottom: 12 }}>
                {cols.map((col, colIdx) => (
                  <div key={colIdx} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    {col.map((item) => {
                      const globalIndex = items.indexOf(item)
                      return (
                        <GalleryImg
                          key={item.fileId}
                          item={item}
                          onOpen={(blobUrl) => openLightbox(globalIndex, blobUrl)}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.93)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={closeLightbox}
        >
          <div
            style={{ position: "relative", maxWidth: 1100, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                padding: "0 2px",
              }}
            >
              <span style={{ fontSize: 13, color: "#a39d96", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selected.name}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 16, flexShrink: 0 }}>
                {/* Counter */}
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#6b665f" }}>
                  {(selectedIndex ?? 0) + 1} / {items.length}
                </span>
                <a
                  href={driveApi.getDownloadUrl(selected.fileId)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#a39d96", padding: 4, display: "flex", alignItems: "center", transition: "color 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#ff7a1a" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#a39d96" }}
                  title="Download"
                >
                  <Download style={{ width: 18, height: 18 }} />
                </a>
                <button
                  onClick={closeLightbox}
                  style={{ background: "transparent", border: "none", color: "#a39d96", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", transition: "color 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e8e3de" }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#a39d96" }}
                  title="Close (Esc)"
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </div>

            {/* Media + side arrows */}
            <div
              onWheel={selected.mime.startsWith("image/") ? handleWheel : undefined}
              onMouseDown={selected.mime.startsWith("image/") ? handleMouseDown : undefined}
              onMouseMove={selected.mime.startsWith("image/") ? handleMouseMove : undefined}
              onMouseUp={selected.mime.startsWith("image/") ? handleMouseUp : undefined}
              onMouseLeave={selected.mime.startsWith("image/") ? handleMouseUp : undefined}
              onDoubleClick={selected.mime.startsWith("image/") ? handleDblClick : undefined}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                overflow: "hidden",
                background: "#0f0e0d",
                border: "1px solid #221f1c",
                minHeight: 200,
                cursor: selected.mime.startsWith("image/")
                  ? zoom > 1
                    ? dragging ? "grabbing" : "grab"
                    : "zoom-in"
                  : "default",
                userSelect: "none",
              }}
            >
              {lightboxLoading && (
                <Loader2 style={{ width: 32, height: 32, color: "#ff7a1a", animation: "spin 1s linear infinite" }} />
              )}
              {!lightboxLoading && selectedBlobUrl && selected.mime.startsWith("image/") && (
                <img
                  ref={imgRef}
                  src={selectedBlobUrl}
                  alt={selected.name}
                  draggable={false}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "82vh",
                    objectFit: "contain",
                    display: "block",
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                    transformOrigin: "center center",
                    transition: dragging ? "none" : "transform 0.18s ease",
                    pointerEvents: "none",
                  }}
                />
              )}
              {!lightboxLoading && selectedBlobUrl && selected.mime.startsWith("video/") && (
                <video
                  src={selectedBlobUrl}
                  controls
                  autoPlay
                  style={{ maxWidth: "100%", maxHeight: "82vh", display: "block", background: "#000" }}
                />
              )}

              {/* Zoom indicator */}
              {zoom > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); resetZoom() }}
                  title="Reset zoom (Esc)"
                  style={{
                    position: "absolute",
                    bottom: 12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 10,
                    height: 26,
                    padding: "0 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(0,0,0,0.7)",
                    color: "#e8e3de",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "'Geist Mono', monospace",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {Math.round(zoom * 10) / 10}× — klik za reset
                </button>
              )}

              {/* Prev arrow */}
              {zoom === 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(-1) }}
                  title="Previous (←)"
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(0,0,0,0.6)",
                    color: "#e8e3de",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(4px)",
                    transition: "background 0.15s, border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,122,26,0.85)"; e.currentTarget.style.borderColor = "#ff7a1a"; e.currentTarget.style.color = "#fff" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#e8e3de" }}
                >
                  <ChevronLeft style={{ width: 22, height: 22 }} />
                </button>
              )}

              {/* Next arrow */}
              {zoom === 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(1) }}
                  title="Next (→)"
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(0,0,0,0.6)",
                    color: "#e8e3de",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(4px)",
                    transition: "background 0.15s, border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,122,26,0.85)"; e.currentTarget.style.borderColor = "#ff7a1a"; e.currentTarget.style.color = "#fff" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#e8e3de" }}
                >
                  <ChevronRight style={{ width: 22, height: 22 }} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes galleryPulse {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes galleryFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
