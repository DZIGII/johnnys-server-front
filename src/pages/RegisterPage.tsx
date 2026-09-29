import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { userApi } from "@/api/user.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await userApi.register(form)
      setSuccess(true)
      setTimeout(() => navigate("/login"), 2500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Registration failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0d0c0b] py-20">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#ff7a1a] flex items-center justify-center shadow-[0_0_20px_rgba(255,122,26,0.4)]">
              <span className="text-black font-bold">J</span>
            </div>
          </div>
          <CardTitle className="text-center text-xl">Create account</CardTitle>
          <CardDescription className="text-center">
            Join Johnny's Server today.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-md px-3 py-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 border border-green-800/30 rounded-md px-3 py-2 mb-4">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Account created! Redirecting to login…
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={form.firstName} onChange={set("firstName")} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={form.lastName} onChange={set("lastName")} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nickname">Nickname</Label>
              <Input id="nickname" placeholder="@handle" value={form.nickname} onChange={set("nickname")} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Register
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center text-sm text-[#8a7e74]">
          Already have an account?&nbsp;
          <Link to="/login" className="text-[#ff7a1a] hover:underline">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
