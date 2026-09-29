import { SlidersHorizontal } from "lucide-react"

export default function SettingsPage() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: "#6b665f",
        padding: 32,
        minHeight: "100%",
      }}
    >
      <SlidersHorizontal size={40} style={{ opacity: 0.3 }} />
      <p style={{ fontSize: 16, color: "#a39d96", margin: 0 }}>Settings coming soon</p>
    </div>
  )
}
