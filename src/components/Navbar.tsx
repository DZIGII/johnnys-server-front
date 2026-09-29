import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { HardDrive, LogOut, Shield, User } from "lucide-react"

export default function Navbar() {
  const { isAuthenticated, user, logout, isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-[#2a2420]/60 bg-[#0d0c0b]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#ff7a1a] flex items-center justify-center shadow-[0_0_16px_rgba(255,122,26,0.4)]">
            <span className="text-black font-bold text-sm">J</span>
          </div>
          <span className="font-semibold text-[#f5f0eb] group-hover:text-[#ff7a1a] transition-colors">
            Johnny's Server
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link to="/drive">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <HardDrive className="w-4 h-4" />
                  Drive
                </Button>
              </Link>
              {isSuperAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <User className="w-4 h-4" />
                  {user?.nickName ?? user?.firstName}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
