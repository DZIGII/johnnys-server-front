import { useEffect, useState } from "react"
import { userApi } from "@/api/user.api"
import type { UserDto } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Shield, Loader2, UserCheck, UserX, Search } from "lucide-react"

export default function AdminPage() {
  const [users, setUsers] = useState<UserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers(query?: string) {
    setLoading(true)
    try {
      const res = await userApi.filter(query ? { email: query } : {})
      setUsers(res.data)
    } finally {
      setLoading(false)
    }
  }

  async function enable(email: string) {
    setActionLoading(email)
    try {
      await userApi.enable({ email })
      await fetchUsers()
    } finally {
      setActionLoading(null)
    }
  }

  async function disable(email: string) {
    if (!confirm(`Disable account for ${email}?`)) return
    setActionLoading(email)
    try {
      await userApi.disable({ email })
      await fetchUsers()
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = users.filter(
    (u) =>
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0d0c0b] pt-20 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-5 h-5 text-[#ff7a1a]" />
          <h1 className="text-xl font-semibold text-[#f5f0eb]">User Management</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a7e74]" />
          <Input
            className="pl-9"
            placeholder="Search by email or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#ff7a1a]" />
          </div>
        ) : (
          <div className="rounded-xl border border-[#2a2420] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 py-3 border-b border-[#2a2420] bg-[#181614] text-xs text-[#8a7e74] uppercase tracking-widest">
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>Actions</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-12 text-center text-[#8a7e74] text-sm">No users found.</div>
            ) : (
              filtered.map((u, i) => (
                <div
                  key={u.email}
                  className={`grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-center px-4 py-3 ${
                    i < filtered.length - 1 ? "border-b border-[#2a2420]" : ""
                  } hover:bg-[#181614] transition-colors`}
                >
                  <div>
                    <p className="text-sm text-[#f5f0eb] font-medium">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-[#8a7e74]">@{u.nickName}</p>
                  </div>
                  <span className="text-sm text-[#8a7e74] truncate">{u.email}</span>
                  <Badge variant={u.role === "SUPER_ADMIN" ? "default" : "secondary"}>
                    {u.role ?? "USER"}
                  </Badge>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-green-400 border-green-800/30 hover:bg-green-900/20"
                      disabled={actionLoading === u.email}
                      onClick={() => enable(u.email)}
                    >
                      {actionLoading === u.email ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                      Enable
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-red-400 border-red-800/30 hover:bg-red-900/20"
                      disabled={actionLoading === u.email}
                      onClick={() => disable(u.email)}
                    >
                      {actionLoading === u.email ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserX className="w-3.5 h-3.5" />
                      )}
                      Disable
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
