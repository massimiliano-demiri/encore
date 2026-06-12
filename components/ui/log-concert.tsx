"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { PhotoUpload } from "@/components/photo-upload"
import { Calendar } from "lucide-react"

export function LogConcert({ concertId, concertDate }: { concertId: string; concertDate?: string | null }) {
	const { user } = useUser()
	const supabase = createClient()
	const [rating, setRating] = useState("")
	const [review, setReview] = useState("")
	const [logId, setLogId] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [msg, setMsg] = useState<string | null>(null)

	const isFuture = concertDate ? new Date(concertDate) > new Date() : false

	useEffect(() => {
		if (!user || !supabase) return
		supabase
			.from("logs")
			.select("id, rating, review")
			.eq("user_id", user.id)
			.eq("concert_id", concertId)
			.maybeSingle()
			.then(({ data }) => {
				if (data) {
					setLogId(data.id)
					setRating(data.rating != null ? String(data.rating) : "")
					setReview(data.review ?? "")
				}
			})
	}, [user, concertId, supabase])

	if (!user)
		return <p className="text-sm text-white/50">Accedi per votare questo concerto.</p>

	// Concerto futuro: niente form di voto
	if (isFuture) {
		return (
			<div className="border-l-2 border-[#FFC24B]/20 bg-white/[0.02] py-3 pl-4">
				<p className="text-sm text-white/50 inline-flex items-center gap-1.5">
					<Calendar className="h-3.5 w-3.5 text-[#FFC24B]" />
					Concerto in programma — potrai lasciare voto e recensione dopo la data.
				</p>
			</div>
		)
	}

	const save = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!supabase) return
		setSaving(true)
		setMsg(null)
		const { data, error } = await supabase
			.from("logs")
			.upsert(
				{
					user_id: user.id,
					concert_id: concertId,
					rating: rating ? Number(rating) : null,
					review: review.trim() || null,
				},
				{ onConflict: "user_id,concert_id" },
			)
			.select("id")
			.maybeSingle()
		setSaving(false)
		if (error) {
			setMsg(error.message)
			return
		}
		if (data) setLogId(data.id)
		setMsg("Salvato! Ora puoi aggiungere le foto qui sotto.")
	}

	const remove = async () => {
		if (!supabase) return
		if (!confirm("Vuoi eliminare questo log?")) return
		await supabase.from("logs").delete().eq("user_id", user.id).eq("concert_id", concertId)
		window.location.reload()
	}

	return (
		<form onSubmit={save} className="flex flex-col gap-3 border-l-2 border-white/10 bg-white/[0.02] py-3 pl-4">
			<h3 className="font-semibold text-white">
				{logId ? "Modifica il tuo voto" : "C'eri? Vota e racconta"}
			</h3>
			<div className="flex items-center gap-2">
				<label className="text-sm text-white/50">Voto</label>
				<select
					value={rating}
					onChange={(e) => setRating(e.target.value)}
					className="rounded border border-white/15 bg-white/5 px-2 py-1 text-sm"
				>
					<option value="">—</option>
					{[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((n) => (
						<option key={n} value={n}>{n}★</option>
					))}
				</select>
			</div>
			<textarea
				value={review}
				onChange={(e) => setReview(e.target.value)}
				placeholder="Com'è stato? (facoltativo)"
				rows={3}
				className="rounded border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#FF2D6B]"
			/>
			{msg && <p className="text-sm text-white/50">{msg}</p>}
			<div className="flex items-center gap-2">
				<button
					disabled={saving}
					className="rounded bg-[#FF2D6B] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
				>
					{saving ? "Salvo…" : logId ? "Aggiorna" : "Salva"}
				</button>
				{logId && (
					<button
						type="button"
						onClick={remove}
						className="rounded border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
					>
						Elimina
					</button>
				)}
			</div>
			{logId && (
				<div className="border-t border-white/10 pt-3">
					<p className="mb-2 text-sm font-medium text-white/80">Le tue foto</p>
					<PhotoUpload logId={logId} />
				</div>
			)}
		</form>
	)
}