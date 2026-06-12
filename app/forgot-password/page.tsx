"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
	const supabase = createClient()
	const [email, setEmail] = useState("")
	const [sent, setSent] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const sendReset = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!supabase || !email.trim()) return
		setError(null)
		setLoading(true)
		const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${window.location.origin}/auth/reset-password`,
		})
		setLoading(false)
		if (err) setError(err.message)
		else setSent(true)
	}

	if (sent) {
		return (
			<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
				<div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FF2D6B]/20 blur-[130px]" />
				<div className="relative w-full max-w-sm">
					<div className="mb-8 text-center">
						<h1 className="text-4xl font-bold [font-family:var(--font-display)]">Enc<span className="text-[#FF2D6B]">o</span>re</h1>
					</div>
					<div className="flex flex-col items-center gap-3 border border-white/10 bg-white/[0.02] p-8 text-center">
						<CheckCircle2 className="h-10 w-10 text-[#FF2D6B]" />
						<p className="font-medium">Ti ho mandato un link</p>
						<p className="text-sm text-white/50">Controlla la posta per reimpostare la password.</p>
						<p className="text-xs text-white/30">{email}</p>
					</div>
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
					<h2 className="text-xl font-bold [font-family:var(--font-display)]">Password dimenticata</h2>
					<p className="mt-1 text-sm text-white/40">Inserisci la tua email e ti mando un link per reimpostarla.</p>
				</div>

				<form onSubmit={sendReset} className="flex flex-col gap-3">
					<div className="relative">
						<Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
						<input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
							className="w-full border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#FF2D6B]" />
					</div>
					{error && <p className="text-sm text-red-400">{error}</p>}
					<button disabled={loading || !email.trim()} type="submit"
						className="inline-flex items-center justify-center gap-2 bg-[#7A5CFF] py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40">
						{loading ? "Invio…" : "Invia link di reset"}
					</button>
				</form>

				<p className="mt-4 text-center">
					<Link href="/login" className="inline-flex items-center gap-1 text-sm text-white/40 hover:text-white transition">
						<ArrowLeft className="h-3.5 w-3.5" /> Torna al login
					</Link>
				</p>
			</div>
		</main>
	)
}