import { Folder, Trash2 } from "lucide-react"
import { useState } from "react"

interface Props {
  name: string
  onClick: () => void
  onDelete: () => void
}

export default function FolderCard({ name, onClick, onDelete }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? "rgba(255,122,26,0.2)" : "#221f1c"}`,
        borderRadius: 12,
        background: hovered ? "#161412" : "#121110",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top area — 4:3 aspect ratio */}
      <div
        style={{
          aspectRatio: "4/3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0e0d",
        }}
      >
        <Folder size={40} color="#ff7a1a" />
      </div>

      {/* Bottom info */}
      <div style={{ padding: 14, borderTop: "1px solid #1f1d1a" }}>
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
        <p style={{ fontSize: 11, color: "#a39d96", margin: "3px 0 0", lineHeight: 1 }}>Folder</p>
      </div>

      {/* Delete button (visible on hover) */}
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          title="Delete folder"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "rgba(0,0,0,0.6)",
            border: "1px solid #221f1c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#a39d96",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#a39d96" }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}
