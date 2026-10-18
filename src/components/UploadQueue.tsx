import { useState } from "react"
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react"
import type { UploadItem, UploadStatus } from "@/hooks/useUploadQueue"

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatSize(b: number) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
  return `${(b / 1e3).toFixed(0)} KB`
}

const STATUS_LABEL: Record<UploadStatus, string> = {
  queued: "U redu",
  uploading: "Šalje se",
  processing: "Obrađuje se",
  done: "Gotovo",
  error: "Greška",
  canceled: "Otkazano",
}

function StatusIcon({ status }: { status: UploadStatus }) {
  if (status === "done")
    return <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
  if (status === "error")
    return <XCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
  if (status === "uploading" || status === "processing")
    return <Loader2 className="w-3.5 h-3.5 shrink-0 text-[#ff7a1a] animate-spin" />
  if (status === "canceled")
    return <XCircle className="w-3.5 h-3.5 shrink-0 text-[#6b665f]" />
  return <Clock className="w-3.5 h-3.5 shrink-0 text-[#8a7e74]" />
}

function ProgressBar({ value, status }: { value: number; status: UploadStatus }) {
  const color =
    status === "done"
      ? "#34d399"
      : status === "error"
        ? "#f87171"
        : status === "canceled"
          ? "#3a3530"
          : "#ff7a1a"

  return (
    <div
      style={{
        height: 2,
        borderRadius: 9999,
        background: "#221f1c",
        overflow: "hidden",
        marginTop: 6,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.round(value * 100)}%`,
          background: color,
          borderRadius: 9999,
          transition: "width 0.2s linear",
        }}
      />
    </div>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

interface UploadQueueProps {
  items: UploadItem[]
  doneCount: number
  total: number
  isBusy: boolean
  onCancel: (id: string) => void
  onClear: () => void
}

export function UploadQueue({
  items,
  doneCount,
  total,
  isBusy,
  onCancel,
  onClear,
}: UploadQueueProps) {
  const [minimized, setMinimized] = useState(false)

  if (items.length === 0) return null

  const overallProgress = total > 0 ? doneCount / total : 0
  const hasFinished = items.some((i) => i.status === "done" || i.status === "error" || i.status === "canceled")

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 340,
        zIndex: 300,
        borderRadius: 12,
        border: "1px solid #2a2520",
        background: "#121110",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        overflow: "hidden",
      }}
    >
      {/* ── header ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderBottom: minimized ? "none" : "1px solid #1f1d1a",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setMinimized((v) => !v)}
      >
        {isBusy && <Loader2 className="w-4 h-4 shrink-0 text-[#ff7a1a] animate-spin" />}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#e8e3de" }}>
          {isBusy
            ? `Šalje se — ${doneCount} / ${total}`
            : `Završeno — ${doneCount} / ${total}`}
        </span>
        {hasFinished && !isBusy && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClear()
            }}
            title="Očisti završene"
            style={{
              display: "flex",
              alignItems: "center",
              padding: 4,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              color: "#6b665f",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#a39d96")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b665f")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMinimized((v) => !v)
          }}
          style={{
            display: "flex",
            alignItems: "center",
            padding: 4,
            borderRadius: 6,
            border: "none",
            background: "transparent",
            color: "#6b665f",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#a39d96")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6b665f")}
        >
          {minimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* overall progress strip */}
      {!minimized && isBusy && (
        <div style={{ height: 2, background: "#1a1815" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.round(overallProgress * 100)}%`,
              background: "#ff7a1a",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      {/* ── list ────────────────────────────────────────────────────────────── */}
      {!minimized && (
        <div style={{ maxHeight: 280, overflowY: "auto", padding: "6px 0" }}>
          {items.map((item, idx) => (
            <div
              key={item.id}
              style={{
                padding: "8px 14px",
                borderBottom: idx < items.length - 1 ? "1px solid #191714" : "none",
              }}
            >
              {/* row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StatusIcon status={item.status} />

                {/* name */}
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: item.status === "canceled" ? "#6b665f" : "#e8e3de",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={item.file.name}
                >
                  {item.file.name}
                </span>

                {/* size */}
                <span style={{ fontSize: 11, color: "#6b665f", flexShrink: 0 }}>
                  {formatSize(item.file.size)}
                </span>

                {/* status label */}
                <span
                  style={{
                    fontSize: 11,
                    flexShrink: 0,
                    color:
                      item.status === "done"
                        ? "#34d399"
                        : item.status === "error"
                          ? "#f87171"
                          : item.status === "canceled"
                            ? "#4a4540"
                            : item.status === "uploading" || item.status === "processing"
                              ? "#ff7a1a"
                              : "#8a7e74",
                  }}
                >
                  {item.status === "uploading"
                    ? `${Math.round(item.progress * 100)}%`
                    : STATUS_LABEL[item.status]}
                </span>

                {/* cancel button */}
                {(item.status === "queued" || item.status === "uploading") && (
                  <button
                    onClick={() => onCancel(item.id)}
                    title="Otkaži"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: 2,
                      borderRadius: 4,
                      border: "none",
                      background: "transparent",
                      color: "#4a4540",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#4a4540")}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* progress bar */}
              {(item.status === "uploading" ||
                item.status === "processing" ||
                item.status === "done" ||
                item.status === "error") && (
                <ProgressBar value={item.progress} status={item.status} />
              )}

              {/* error message */}
              {item.error && (
                <p style={{ fontSize: 11, color: "#f87171", margin: "4px 0 0 22px" }}>
                  {item.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
