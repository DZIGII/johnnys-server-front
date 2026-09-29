import { useAuth } from "@/context/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import { LogOut, User } from "lucide-react"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0d0c0b] pt-20 pb-12 px-4 flex items-start justify-center">
      <Card className="w-full max-w-sm mt-8">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-[#ff7a1a]/15 border border-[#ff7a1a]/30 flex items-center justify-center">
              <User className="w-8 h-8 text-[#ff7a1a]" />
            </div>
          </div>
          <CardTitle className="text-center text-lg">
            {user.firstName} {user.lastName}
          </CardTitle>
          {/* backend toUserResponseDto returns nickName (capital N) */}
          <p className="text-center text-sm text-[#8a7e74]">@{user.nickName}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-[#2a2420] divide-y divide-[#2a2420]">
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-[#8a7e74]">Email</span>
              <span className="text-[#f5f0eb]">{user.email}</span>
            </div>
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-[#8a7e74]">Role</span>
              <Badge variant={user.role === "SUPER_ADMIN" ? "default" : "secondary"}>
                {user.role ?? "USER"}
              </Badge>
            </div>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
