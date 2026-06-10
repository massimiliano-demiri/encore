"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { AtSign, ArrowRight } from "lucide-react"

export default function OnboardingPage() {
	const { user, loading } = useUser()
	const router = useRouter()
	const supabase = createClient()
	const [username, setUsername] = useState("")
	const [displayName, setDisplayName] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!loading && !user) router.push("/login")
	}, [loading, user])

	const save = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!user) return
		const clean = username.toLowerCase().trim().replace(/[^a-z0-9._]/g, "")
		if (clean.length < 3) {
			setError("Lo username deve avere almeno 3 caratteri (lettere, numeri, . o _).")
			return
		}
		setSaving(true)
		setError(null)
		const { error: err } = await supabase
			.from("profiles")
			.update({ username: clean, display_name: displayName.trim() || clean })
			.eq("id", user.id)
		setSaving(false)
		if (err) {
			setError(err.code === "23505" ? "Username già in uso, scegline un altro." : err.message)
			return
		}
		router.push("/me")
	}

	if (loading) return <main className="p-6">Carico…</main>

	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
			<div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#7A5CFF]/20 blur-[130px]" />

			<div className="relative w-full max-w-sm">
				<div className="mb-6 text-center">
					<p className="text-xs font-semibold uppercase tracking-widest text-[#FF2D6B]">Ci siamo quasi</p>
					<h1 className="mt-1 text-2xl font-bold [font-family:var(--font-display)]">Scegli il tuo nome utente</h1>
					<p className="mt-2 text-sm text-white/50">
						Ti serve per il profilo pubblico: encored.app/u/<span className="text-white">tuonome</span>
					</p>
				</div>

				<form onSubmit={save} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
					<div className="relative">
						<AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
						<input
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="username"
							className="w-full rounded-lg border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#FF2D6B]"
						/>
					</div>
					<input
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						placeholder="Nome visualizzato (facoltativo)"
						className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none transition focus:border-[#FF2D6B]"
					/>
					{error && <p className="text-sm text-red-400">{error}</p>}
					<button
						disabled={saving}
						className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF2D6B] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
					>
						{saving ? "Salvo…" : "Continua"}
						{!saving && <ArrowRight className="h-4 w-4" />}
					</button>
				</form>
			</div>
		</main>
	)
}