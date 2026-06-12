"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react"

export default function ResetPasswordPage() {
	const supabase = createClient()
	const router = useRouter()
	const [password, setPassword] = useState("")
	const [showPw, setShowPw] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [done, setDone] = useState(false)
	const [hasSession, setHasSession] = useState(false)

	useEffect(() => {
		if (!supabase) return
		supabase.auth.getSession().then(({ data }) => {
			if (data.session) setHasSession(true)
		})
	}, [supabase])

	const handleReset = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!supabase) return
		if (password.length < 6) { setError("La password deve avere almeno 6 caratteri."); return }
		setError(null)
		setLoading(true)
		const { error: err } = await supabase.auth.updateUser({ password })
		setLoading(false)
		if (err) { setError(err.message); return }
		setDone(true)
		setTimeout(() => router.push("/me"), 2500)
	}

	if (done) {
		return (
			<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
				<div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FF2D6B]/20 blur-[130px]" />
				<div className="relative w-full max-w-sm flex flex-col items-center gap-3 border border-white/10 bg-white/[0.02] p-8 text-center">
					<CheckCircle2 className="h-10 w-10 text-[#FF2D6B]" />
					<p className="font-medium">Password aggiornata</p>
					<p className="text-sm text-white/50">Ti sto portando al tuo diario…</p>
				</div>
			</main>
		)
	}

	if (!hasSession) {
		return (
			<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
				<div className="relative w-full max-w-sm border border-white/10 bg-white/[0.02] p-8 text-center">
					<p className="text-white/50">Link non valido o scaduto.</p>
					<p className="mt-2 text-sm text-white/40">
						Torna al <a href="/login" className="text-[#FF2D6B] hover:underline">login</a> e richiedi un nuovo link.
					</p>
				</div>
			</main>
		)
	}

	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
			<div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#7A5CFF]/20 blur-[130px]" />
			<div className="relative w-full max-w-sm">
				<div className="mb-8 text-center">
					<h1 className="text-4xl font-bold [font-family:var(--font-display)]">Enc<span className="text-[#FF2D6B]">o</span>re</h1>
				</div>

				<div className="mb-2">
					<h2 className="text-xl font-bold [font-family:var(--font-display)]">Nuova password</h2>
					<p className="mt-1 text-sm text-white/40">Scegli una password di almeno 6 caratteri.</p>
				</div>

				<form onSubmit={handleReset} className="flex flex-col gap-3">
					<div className="relative">
						<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
						<input type={showPw ? "text" : "password"} placeholder="Nuova password" value={password} onChange={(e) => setPassword(e.target.value)}
							className="w-full border border-white/15 bg-white/5 py-2.5 pl-9 pr-10 text-sm outline-none transition focus:border-[#FF2D6B]" />
						<button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
							{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
					{error && <p className="text-sm text-red-400">{error}</p>}
					<button disabled={loading || !password} type="submit"
						className="inline-flex items-center justify-center gap-2 bg-[#FF2D6B] py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40">
						{loading ? "Salvo…" : "Aggiorna password"} {!loading && <ArrowRight className="h-4 w-4" />}
					</button>
				</form>
			</div>
		</main>
	)
}