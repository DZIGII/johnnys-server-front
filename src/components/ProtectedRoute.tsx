import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import type { ReactNode } from "react"

interface Props {
  children: ReactNode
  requireSuperAdmin?: boolean
}

export default function ProtectedRoute({ children, requireSuperAdmin = false }: Props) {
  const { isAuthenticated, isSuperAdmin } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requireSuperAdmin && !isSuperAdmin) return <Navigate to="/drive" replace />

  return <>{children}</>
}
