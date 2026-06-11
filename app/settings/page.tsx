"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AvatarUpload } from "@/components/avatar-upload"

export default function SettingsPage() {
	const { user, loading } = useUser()
	const router = useRouter()
	const supabase = createClient()
	const [username, setUsername] = useState("")
	const [displayName, setDisplayName] = useState("")
	const [bio, setBio] = useState("")
	const [city, setCity] = useState("")
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
	const [msg, setMsg] = useState("")

	useEffect(() => {
		if (!user || !supabase) return
		supabase
			.from("profiles")
			.select("username, display_name, bio, city, avatar_url")
			.eq("id", user.id)
			.single()
			.then(({ data }) => {
				if (data) {
					setUsername(data.username ?? "")
					setDisplayName(data.display_name ?? "")
					setBio(data.bio ?? "")
					setCity(data.city ?? "")
					setAvatarUrl(data.avatar_url ?? null)
				}
			})
	}, [user, supabase])

	const save = async () => {
		if (!supabase) return
		setMsg("")
		const clean = username.toLowerCase().trim()
		const { error } = await supabase
			.from("profiles")
			.update({ username: clean, display_name: displayName, bio, city })
			.eq("id", user!.id)
		if (error) {
			setMsg(error.code === "23505" ? "Username già in uso, scegline un altro." : "Errore nel salvataggio.")
			return
		}
		router.push("/u/" + clean)
	}

	if (loading) return <main className="p-6">Carico…</main>
	if (!user) return <main className="p-6">Accedi per modificare il profilo.</main>

	return (
		<main className="mx-auto flex max-w-md flex-col gap-3 p-6">
			<h1 className="text-2xl font-bold [font-family:var(--font-display)]">Il tuo profilo</h1>
			<div className="my-2">
				<label className="mb-2 block text-sm">Foto profilo</label>
				<AvatarUpload userId={user.id} currentUrl={avatarUrl} />
			</div>
			<label className="text-sm">Username (solo minuscole, senza spazi)</label>
			<Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="es. massi" />
			<label className="text-sm">Nome visualizzato</label>
			<Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
			<label className="text-sm">Città</label>
			<Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="es. Milano" />
			<label className="text-sm">Bio</label>
			<Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Due parole su di te" />
			<Button onClick={save}>Salva</Button>
			{msg && <p className="text-sm text-muted-foreground">{msg}</p>}
		</main>
	)
}