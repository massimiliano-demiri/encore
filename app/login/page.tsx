"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
	const [email, setEmail] = useState("")
	const [sent, setSent] = useState(false)
	const [loading, setLoading] = useState(false)
	const supabase = createClient()

	const signIn = async () => {
		if (!supabase) {
			alert("Supabase non configurato: mancano NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY")
			return
		}

		if (!email.trim()) return
		setLoading(true)
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/me` },
		})
		setLoading(false)
		if (!error) setSent(true)
	}

	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
			<div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FF2D6B]/20 blur-[130px]" />

			<div className="relative w-full max-w-sm">
				<div className="mb-8 text-center">
					<h1 className="text-4xl font-bold [font-family:var(--font-display)]">
						Enc<span className="text-[#FF2D6B]">o</span>re
					</h1>
					<p className="mt-2 text-sm text-white/50">Ogni live, per sempre.</p>
				</div>

				{sent ? (
					<div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
						<CheckCircle2 className="h-10 w-10 text-[#FF2D6B]" />
						<p className="font-medium">Controlla la tua email</p>
						<p className="text-sm text-white/50">
							Ti ho mandato un link per entrare a <span className="text-white">{email}</span>.
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
						<label className="text-sm text-white/60">Entra o registrati con la tua email</label>
						<div className="relative">
							<Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
							<input
								type="email"
								placeholder="La tua email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && signIn()}
								className="w-full rounded-lg border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#FF2D6B]"
							/>
						</div>
						<button
							onClick={signIn}
							disabled={loading || !email.trim()}
							className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF2D6B] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
						>
							{loading ? "Invio…" : "Entra con email"}
							{!loading && <ArrowRight className="h-4 w-4" />}
						</button>
						<p className="text-center text-xs text-white/35">Ti invieremo un link magico, niente password.</p>
					</div>
				)}
			</div>
		</main>
	)
}