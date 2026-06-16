"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { PhotoUpload } from "@/components/photo-upload"
import { Calendar, Star } from "lucide-react"

export function LogConcert({ concertId, concertDate }: { concertId: string; concertDate?: string | null }) {
	const { user } = useUser()
	const supabase = createClient()
	const [rating, setRating] = useState(0)
	const [review, setReview] = useState("")
	const [logId, setLogId] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const isFuture = concertDate ? new Date(concertDate) > new Date() : false

	useEffect(() => {
		if (!user || !supabase) return
		supabase.from("logs").select("id, rating, review").eq("user_id", user.id).eq("concert_id", concertId).maybeSingle()
			.then(({ data }) => {
				if (data) { setLogId(data.id); setRating(data.rating != null ? data.rating : 0); setReview(data.review ?? "") }
			})
	}, [user, concertId, supabase])

	if (!user) return <p className="text-sm text-white/50">Accedi per votare questo concerto.</p>

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
		const { data, error } = await supabase
			.from("logs")
			.upsert({ user_id: user.id, concert_id: concertId, rating: rating > 0 ? rating : null, review: review.trim() || null }, { onConflict: "user_id,concert_id" })
			.select("id").maybeSingle()
		setSaving(false)
		if (error) { toast.error(error.message); return }
		if (data) setLogId(data.id)
		toast.success(logId ? "Voto aggiornato" : "Concerto salvato nel tuo diario")
	}

	const remove = async () => {
		if (!supabase) return
		if (!confirm("Vuoi eliminare questo log?")) return
		await supabase.from("logs").delete().eq("user_id", user.id).eq("concert_id", concertId)
		toast.success("Concerto rimosso")
		setTimeout(() => window.location.reload(), 800)
	}

	return (
		<form onSubmit={save} className="flex flex-col gap-3 border-l-2 border-white/10 bg-white/[0.02] py-3 pl-4">
			<h3 className="font-semibold text-white">{logId ? "Modifica il tuo voto" : "C'eri? Vota e racconta"}</h3>

			{/* Stelle tappabili */}
			<div className="flex items-center gap-1">
				{[1, 2, 3, 4, 5].map((n) => (
					<button
						key={n}
						type="button"
						onClick={() => setRating(n === rating ? 0 : n)}
						className="transition hover:scale-110"
						aria-label={n + " stelle"}
					>
						<Star
							className={`h-6 w-6 ${n <= rating ? "fill-[#FFC24B] text-[#FFC24B]" : "text-white/20"}`}
						/>
					</button>
				))}
				{rating > 0 && (
					<span className="ml-1 text-xs text-white/40">{rating}/5</span>
				)}
			</div>

			<textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Com'è stato? (facoltativo)" rows={3}
				className="rounded border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#FF2D6B]" />

			<div className="flex items-center gap-2">
				<button disabled={saving} className="rounded bg-[#FF2D6B] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
					{saving ? "Salvo…" : logId ? "Aggiorna" : "Salva"}
				</button>
				{logId && (
					<button type="button" onClick={remove} className="rounded border border-white/15 px-4 py-2 text-sm hover:bg-white/5">Elimina</button>
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