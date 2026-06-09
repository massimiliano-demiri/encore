"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const RATINGS = ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"]

export function LogConcert({ concertId, userId }: { concertId: string; userId: string }) {
	const [open, setOpen] = useState(false)
	const [rating, setRating] = useState("4")
	const [review, setReview] = useState("")
	const [saved, setSaved] = useState(false)
	const supabase = createClient()

	const save = async () => {
		const { error } = await supabase.from("logs").upsert(
			{
				user_id: userId,
				concert_id: concertId,
				rating: Number(rating),
				review: review || null,
			},
			{ onConflict: "user_id,concert_id" },
		)
		if (!error) {
			setSaved(true)
			setOpen(false)
		}
	}

	if (saved) return <span className="mt-2 inline-block text-sm text-green-600">✓ Loggato</span>

	if (!open)
		return (
			<Button onClick={() => setOpen(true)} size="sm" variant="secondary" className="mt-2">
				C'ero
			</Button>
		)

	return (
		<div className="mt-2 flex flex-col gap-2">
			<select
				value={rating}
				onChange={(e) => setRating(e.target.value)}
				className="rounded border p-1 text-sm"
			>
				{RATINGS.map((r) => (
					<option key={r} value={r}>
						{r} ★
					</option>
				))}
			</select>
			<Textarea
				value={review}
				onChange={(e) => setReview(e.target.value)}
				placeholder="Com'è stato? (facoltativo)"
			/>
			<div className="flex gap-2">
				<Button onClick={save} size="sm">Salva</Button>
				<Button onClick={() => setOpen(false)} size="sm" variant="outline">Annulla</Button>
			</div>
		</div>
	)
}