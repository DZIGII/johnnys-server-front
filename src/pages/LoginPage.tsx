import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { userApi } from "@/api/user.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Verify step
  const [needsVerify, setNeedsVerify] = useState(false)
  const [code, setCode] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await userApi.login({ email, password })
      // If server returns a token directly
      if (res.data.token) {
        login(res.data.token, res.data.user)
        navigate("/drive")
      } else {
        // Server likely sent a verification code
        setNeedsVerify(true)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Login failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await userApi.verify({ email, code })
      if (res.data.token) {
        login(res.data.token, res.data.user)
        navigate("/drive")
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Verification failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0d0c0b]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#ff7a1a] flex items-center justify-center shadow-[0_0_20px_rgba(255,122,26,0.4)]">
              <span className="text-black font-bold">J</span>
            </div>
          </div>
          <CardTitle className="text-center text-xl">
            {needsVerify ? "Verify your account" : "Sign in"}
          </CardTitle>
          <CardDescription className="text-center">
            {needsVerify
              ? "Enter the verification code sent to your email."
              : "Welcome back to Johnny's Server."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-md px-3 py-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {!needsVerify ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  placeholder="Enter code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center text-sm text-[#8a7e74]">
          Don't have an account?&nbsp;
          <Link to="/register" className="text-[#ff7a1a] hover:underline">
            Register
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
