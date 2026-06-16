"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react"

function LoginInner() {
	const supabase = createClient()
	const router = useRouter()
	const params = useSearchParams()
	const rawNext = params.get("next")
	// Solo path interni: niente open-redirect verso domini esterni
	const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/me"

	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [showPw, setShowPw] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!supabase || !email.trim() || !password) return
		setError(null)
		setLoading(true)
		const { error: err } = await supabase.auth.signInWithPassword({ email, password })
		setLoading(false)
		if (err) {
			setError(err.message === "Invalid login credentials" || err.code === "invalid_credentials"
				? "Email o password errati." : err.message)
			return
		}
		router.push(next)
	}

	const signupHref = "/signup" + (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? "?next=" + encodeURIComponent(rawNext) : "")

	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
			<div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FF2D6B]/20 blur-[130px]" />
			<div className="relative w-full max-w-sm">
				<div className="mb-8 text-center">
					<Link href="/" className="text-4xl font-bold [font-family:var(--font-display)]">
						Enc<span className="text-[#FF2D6B]">o</span>re
					</Link>
					<p className="mt-2 text-sm text-white/50">Ogni live, per sempre.</p>
				</div>
				<div className="mb-2">
					<h2 className="text-xl font-bold [font-family:var(--font-display)]">Bentornato</h2>
					<p className="mt-1 text-sm text-white/40">Accedi al tuo diario dei concerti.</p>
				</div>
				<form onSubmit={handleLogin} className="flex flex-col gap-3 border-l-2 border-white/10 bg-white/[0.02] py-4 pl-5 pr-4">
					<div className="relative">
						<Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
						<input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
							className="w-full border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#FF2D6B]" />
					</div>
					<div className="relative">
						<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
						<input type={showPw ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
							className="w-full border border-white/15 bg-white/5 py-2.5 pl-9 pr-10 text-sm outline-none transition focus:border-[#FF2D6B]" />
						<button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60" aria-label={showPw ? "Nascondi password" : "Mostra password"}>
							{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
					<div className="flex justify-end">
						<Link href="/forgot-password" className="text-xs text-white/40 hover:text-white/70 transition">Password dimenticata?</Link>
					</div>
					{error && <p className="text-sm text-red-400">{error}</p>}
					<button disabled={loading || !email.trim() || !password} type="submit"
						className="inline-flex items-center justify-center gap-2 bg-[#FF2D6B] py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-40">
						{loading ? "Accesso…" : "Accedi"} {!loading && <ArrowRight className="h-4 w-4" />}
					</button>
				</form>
				<div className="mt-4 flex flex-col items-center gap-2">
					<Link href={"/login/magic" + (next !== "/me" ? "?next=" + encodeURIComponent(next) : "")} className="inline-flex items-center gap-1 text-xs text-white/35 hover:text-white/60 transition">
						<Sparkles className="h-3 w-3" /> Entra senza password
					</Link>
					<p className="text-sm text-white/40">
						Non hai un account?{" "}
						<Link href={signupHref} className="text-[#FF2D6B] hover:underline">Registrati</Link>
					</p>
				</div>
			</div>
		</main>
	)
}

export default function LoginPage() {
	return (
		<Suspense fallback={<main className="flex min-h-screen items-center justify-center p-6"><div className="h-10 w-40 animate-pulse rounded bg-white/5" /></main>}>
			<LoginInner />
		</Suspense>
	)
}