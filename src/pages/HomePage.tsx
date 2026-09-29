import { Link } from "react-router-dom"
import BlueprintGradientMesh from "@/components/ui/blueprint-gradient-mesh"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { HardDrive, Lock, Image, Share2, ArrowRight } from "lucide-react"

const features = [
  {
    icon: HardDrive,
    title: "Personal Drive",
    desc: "Store and organise all your files in a structured folder hierarchy.",
  },
  {
    icon: Lock,
    title: "Access Control",
    desc: "Mark files as Public or Private. Share only what you want.",
  },
  {
    icon: Image,
    title: "Gallery",
    desc: "Browse all your images and videos in a beautiful media grid.",
  },
  {
    icon: Share2,
    title: "Direct Download",
    desc: "Generate direct download links for public files — no login required.",
  },
]

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Blueprint background */}
        <BlueprintGradientMesh contained direction="diagonal" speed={0.2} />

        {/* Hero content — sits above canvas layers (z-50) */}
        <div className="relative z-50 text-center px-4 max-w-3xl mx-auto">
          {/* Logo mark */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-[#ff7a1a] flex items-center justify-center shadow-[0_0_48px_rgba(255,122,26,0.50)]">
              <span className="text-black font-bold text-4xl leading-none">J</span>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-[#f5f0eb] mb-4 leading-tight">
            Johnny's{" "}
            <span className="text-[#ff7a1a] drop-shadow-[0_0_24px_rgba(255,122,26,0.6)]">
              Server
            </span>
          </h1>

          <p className="text-lg text-[#8a7e74] mb-10 max-w-xl mx-auto">
            Your personal file storage and media server.
            Organise drives, folders and files — all under your control.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            {isAuthenticated ? (
              <Link to="/drive">
                <Button size="lg" className="gap-2 shadow-[0_0_24px_rgba(255,122,26,0.35)]">
                  Open Drive <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="gap-2 shadow-[0_0_24px_rgba(255,122,26,0.35)]">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 text-[#8a7e74]">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#ff7a1a]/40 to-transparent" />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 bg-[#0d0c0b] py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#f5f0eb] mb-3">
            Everything you need
          </h2>
          <p className="text-center text-[#8a7e74] mb-16">
            Simple, fast and private.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-[#2a2420] bg-[#181614] p-6 hover:border-[#ff7a1a]/40 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#ff7a1a]/10 flex items-center justify-center mb-4 group-hover:bg-[#ff7a1a]/20 transition-colors">
                  <Icon className="w-5 h-5 text-[#ff7a1a]" />
                </div>
                <h3 className="font-semibold text-[#f5f0eb] mb-1">{title}</h3>
                <p className="text-sm text-[#8a7e74]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="relative z-10 bg-[#0d0c0b] border-t border-[#2a2420] py-20 px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-[#f5f0eb] mb-3">Ready to start?</h2>
            <p className="text-[#8a7e74] mb-8">Create your account and claim your drive.</p>
            <Link to="/register">
              <Button size="lg" className="shadow-[0_0_24px_rgba(255,122,26,0.30)]">
                Create Account
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
