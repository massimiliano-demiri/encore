"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function AvatarUpload({ userId, currentUrl }: { userId: string; currentUrl: string | null }) {
	const supabase = createClient()
	const [url, setUrl] = useState<string | null>(currentUrl)
	const [busy, setBusy] = useState(false)

	const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!supabase) return
		const file = e.target.files?.[0]
		if (!file) return
		setBusy(true)
		const ext = file.name.split(".").pop()
		const path = userId + "/avatar-" + Date.now() + "." + ext
		const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
		if (upErr) {
			alert("Errore caricamento: " + upErr.message)
			setBusy(false)
			return
		}
		const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path)
		const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", userId)
		if (dbErr) alert("Errore salvataggio: " + dbErr.message)
		else setUrl(pub.publicUrl)
		setBusy(false)
	}

	return (
		<div className="flex items-center gap-4">
			{url ? (
				<img src={url} alt="Avatar" className="h-16 w-16 rounded-full object-cover ring-2 ring-white/10" />
			) : (
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-xs text-white/50">
					Nessuna
				</div>
			)}
			<label className="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
				{busy ? "Carico…" : "Cambia foto"}
				<input type="file" accept="image/*" onChange={upload} disabled={busy} className="hidden" />
			</label>
		</div>
	)
}