"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"

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
		<main className="mx-auto flex max-w-md flex-col gap-4 p-6">
			<h1 className="text-2xl font-bold">Scegli il tuo nome utente</h1>
			<p className="text-sm text-muted-foreground">
				Ti serve per il profilo pubblico: encored.app/u/<span className="text-white">tuonome</span>
			</p>
			<form onSubmit={save} className="flex flex-col gap-3">
				<input
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					placeholder="username"
					className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 outline-none focus:border-[#FF2D6B]"
				/>
				<input
					value={displayName}
					onChange={(e) => setDisplayName(e.target.value)}
					placeholder="Nome visualizzato (facoltativo)"
					className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 outline-none focus:border-[#FF2D6B]"
				/>
				{error && <p className="text-sm text-red-400">{error}</p>}
				<button
					disabled={saving}
					className="rounded-lg bg-[#FF2D6B] px-4 py-2 font-medium text-white disabled:opacity-50"
				>
					{saving ? "Salvo…" : "Continua"}
				</button>
			</form>
		</main>
	)
}