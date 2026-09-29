import React, { createContext, useContext, useState, useEffect } from "react"
import type { UserDto } from "@/api/types"

interface AuthState {
  token: string | null
  user: UserDto | null
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: UserDto) => void
  logout: () => void
  isAuthenticated: boolean
  isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const token = localStorage.getItem("token")
      const user = localStorage.getItem("user")
      return { token, user: user ? JSON.parse(user) : null }
    } catch {
      return { token: null, user: null }
    }
  })

  useEffect(() => {
    if (state.token) localStorage.setItem("token", state.token)
    else localStorage.removeItem("token")

    if (state.user) localStorage.setItem("user", JSON.stringify(state.user))
    else localStorage.removeItem("user")
  }, [state])

  const login = (token: string, user: UserDto) => setState({ token, user })
  const logout = () => setState({ token: null, user: null })

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isAuthenticated: !!state.token,
        isSuperAdmin: state.user?.role === "SUPER_ADMIN",
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
