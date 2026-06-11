"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"

type Photo = { id: string; url: string }

export function PhotoUpload({ logId }: { logId: string }) {
	const { user } = useUser()
	const supabase = createClient()
	const [photos, setPhotos] = useState<Photo[]>([])
	const [uploading, setUploading] = useState(false)
	const [msg, setMsg] = useState<string | null>(null)

	const loadPhotos = () => {
		if (!supabase) return
		supabase
			.from("photos")
			.select("id, url")
			.eq("log_id", logId)
			.then(({ data }) => setPhotos((data as Photo[]) ?? []))
	}

	useEffect(() => {
		loadPhotos()
	}, [logId])

	const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!supabase) return
		const file = e.target.files?.[0]
		if (!file || !user) return
		setUploading(true)
		setMsg(null)
		const ext = file.name.split(".").pop()
		const path = user.id + "/" + logId + "/" + Date.now() + "." + ext
		const { error: upErr } = await supabase.storage.from("concert-photos").upload(path, file)
		if (upErr) {
			setUploading(false)
			setMsg(upErr.message)
			return
		}
		const { data: pub } = supabase.storage.from("concert-photos").getPublicUrl(path)
		const { error: insErr } = await supabase
			.from("photos")
			.insert({ log_id: logId, url: pub.publicUrl })
		setUploading(false)
		if (insErr) {
			setMsg(insErr.message)
			return
		}
		e.target.value = ""
		loadPhotos()
	}

	const remove = async (id: string) => {
		if (!supabase) return
		await supabase.from("photos").delete().eq("id", id)
		loadPhotos()
	}

	return (
		<div className="flex flex-col gap-2">
			{photos.length > 0 && (
				<div className="grid grid-cols-3 gap-2">
					{photos.map((p) => (
						<div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg">
							<img src={p.url} alt="" className="h-full w-full object-cover" />
							<button
								type="button"
								onClick={() => remove(p.id)}
								className="absolute right-1 top-1 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100"
							>
								Elimina
							</button>
						</div>
					))}
				</div>
			)}
			<label className="cursor-pointer text-sm text-[#FF2D6B] hover:underline">
				{uploading ? "Carico…" : "+ Aggiungi una foto"}
				<input type="file" accept="image/*" onChange={onFile} className="hidden" disabled={uploading} />
			</label>
			{msg && <p className="text-sm text-red-400">{msg}</p>}
		</div>
	)
}