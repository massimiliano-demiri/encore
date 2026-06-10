"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Photo = { id: string; url: string }

export function ConcertPhotos({ concertId }: { concertId: string }) {
	const [photos, setPhotos] = useState<Photo[]>([])

	useEffect(() => {
		const supabase = createClient()
		supabase
			.from("photos")
			.select("id, url, logs!inner(concert_id)")
			.eq("logs.concert_id", concertId)
			.then(({ data }) => setPhotos((data as unknown as Photo[]) ?? []))
	}, [concertId])

	if (photos.length === 0) return null

	return (
		<div>
			<h2 className="mb-2 font-semibold">Foto dal concerto</h2>
			<div className="grid grid-cols-3 gap-2">
				{photos.map((p) => (
					<a
						key={p.id}
						href={p.url}
						target="_blank"
						rel="noreferrer"
						className="aspect-square overflow-hidden rounded-lg"
					>
						<img src={p.url} alt="" className="h-full w-full object-cover" />
					</a>
				))}
			</div>
		</div>
	)
}