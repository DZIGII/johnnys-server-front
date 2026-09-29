import type { ReactNode } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { HardDrive, Image, SlidersHorizontal, LogOut } from "lucide-react"

interface Props {
  children: ReactNode
}

const NAV_ITEMS = [
  { label: "My Drive", icon: HardDrive, path: "/drive" },
  { label: "Gallery", icon: Image, path: "/gallery" },
  { label: "Settings", icon: SlidersHorizontal, path: "/settings" },
]

function getInitials(firstName: string, lastName?: string) {
  const a = firstName?.[0] ?? ""
  const b = lastName?.[0] ?? ""
  return (a + b).toUpperCase()
}

export default function AppLayout({ children }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const initials = user ? getInitials(user.firstName, user.lastName) : "?"
  const displayName = user ? `${user.firstName} ${user.lastName}` : ""
  const nick = user?.nickName ? `@${user.nickName}` : ""

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0d0c0b",
        color: "#e8e3de",
      }}
    >
      {/* ── Sidebar (desktop) ─────────────────────────────────────────────── */}
      <aside
        style={{
          width: 260,
          minWidth: 260,
          background: "#0f0e0d",
          borderRight: "1px solid #1f1d1a",
          flexDirection: "column",
          padding: "20px 12px",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
        }}
        className="hidden md:flex"
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px", marginBottom: 28 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#ff7a1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 0 12px rgba(255,122,26,0.4)",
            }}
          >
            <span style={{ color: "#000", fontWeight: 700, fontSize: 14, lineHeight: 1 }}>J</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: "#e8e3de" }}>Johnny's Server</span>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
            const isActive = location.pathname === path || location.pathname.startsWith(path + "/")
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  border: "none",
                  background: isActive ? "rgba(255,122,26,0.12)" : "transparent",
                  color: isActive ? "#ff7a1a" : "#a39d96",
                  fontSize: 14,
                  fontWeight: isActive ? 500 : 400,
                  textAlign: "left",
                  transition: "background 0.15s, color 0.15s",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#171513"
                    e.currentTarget.style.color = "#e8e3de"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color = "#a39d96"
                  }
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* User row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 4px",
              borderTop: "1px solid #1f1d1a",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,122,26,0.12)",
                border: "1px solid #221f1c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: "#ff7a1a" }}>{initials}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#e8e3de", margin: 0, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayName}
              </p>
              <p style={{ fontSize: 11, color: "#6b665f", margin: 0, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {nick}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#6b665f",
                display: "flex",
                alignItems: "center",
                padding: 4,
                borderRadius: 6,
                transition: "color 0.15s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#e8e3de" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#6b665f" }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile top header ──────────────────────────────────────────────── */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "#0f0e0d",
          borderBottom: "1px solid #1f1d1a",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 50,
        }}
        className="flex md:hidden"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#ff7a1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#000", fontWeight: 700, fontSize: 14 }}>J</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: "#e8e3de" }}>Johnny's Server</span>
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(255,122,26,0.12)",
            border: "1px solid #221f1c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: "#ff7a1a" }}>{initials}</span>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          flexDirection: "column",
        }}
        className="flex md:ml-[260px] pt-14 md:pt-0"
      >
        {children}
      </main>

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "#0f0e0d",
          borderTop: "1px solid #1f1d1a",
          alignItems: "stretch",
          zIndex: 50,
        }}
        className="flex md:hidden"
      >
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + "/")
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: isActive ? "#ff7a1a" : "#6b665f",
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
