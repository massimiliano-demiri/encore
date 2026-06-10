"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function SettingsPage() {
	const { user, loading } = useUser()
	const router = useRouter()
	const supabase = createClient()
	const [username, setUsername] = useState("")
	const [displayName, setDisplayName] = useState("")
	const [bio, setBio] = useState("")
	const [msg, setMsg] = useState("")

	useEffect(() => {
		if (!user) return
		supabase
			.from("profiles")
			.select("username, display_name, bio")
			.eq("id", user.id)
			.single()
			.then(({ data }) => {
				if (data) {
					setUsername(data.username ?? "")
					setDisplayName(data.display_name ?? "")
					setBio(data.bio ?? "")
				}
			})
	}, [user])

	const save = async () => {
		setMsg("")
		const clean = username.toLowerCase().trim()
		const { error } = await supabase
			.from("profiles")
			.update({ username: clean, display_name: displayName, bio })
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
			<h1 className="text-2xl font-bold">Il tuo profilo</h1>
			<label className="text-sm">Username (solo minuscole, senza spazi)</label>
			<Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="es. massi" />
			<label className="text-sm">Nome visualizzato</label>
			<Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
			<label className="text-sm">Bio</label>
			<Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Due parole su di te" />
			<Button onClick={save}>Salva</Button>
			{msg && <p className="text-sm text-muted-foreground">{msg}</p>}
		</main>
	)
}