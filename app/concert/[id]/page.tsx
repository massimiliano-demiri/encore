"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type Concert = {
	id: string
	date: string
	artists: { name: string } | null
	venues: { name: string; city: string } | null
}

type Log = {
	rating: number | null
	review: string | null
	logged_at: string
}

export default function ConcertPage() {
	const params = useParams()
	const id = params.id as string
	const supabase = createClient()
	const [concert, setConcert] = useState<Concert | null>(null)
	const [logs, setLogs] = useState<Log[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			const { data: c } = await supabase
				.from("concerts")
				.select("id, date, artists(name), venues(name, city)")
				.eq("id", id)
				.single()
			const { data: l } = await supabase
				.from("logs")
				.select("rating, review, logged_at")
				.eq("concert_id", id)
				.order("logged_at", { ascending: false })
			setConcert(c as unknown as Concert)
			setLogs((l as unknown as Log[]) ?? [])
			setLoading(false)
		}
		load()
	}, [id, supabase])

	if (loading) return <main className="p-6">Carico…</main>
	if (!concert) return <main className="p-6">Concerto non trovato.</main>

	const rated = logs.filter((x) => x.rating != null)
	const avg =
		rated.length > 0
			? (rated.reduce((s, x) => s + (x.rating ?? 0), 0) / rated.length).toFixed(1)
			: null

	return (
		<main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-bold">{concert.artists?.name ?? "Artista"}</h1>
				<p className="text-muted-foreground">
					{concert.venues?.name}
					{concert.venues?.city ? ", " + concert.venues.city : ""}
				</p>
				<p className="text-muted-foreground">{concert.date}</p>
			</div>

			<div className="flex items-center gap-4 rounded-lg border p-4">
				<div className="text-3xl font-bold">{avg ?? "—"}</div>
				<div className="text-sm text-muted-foreground">
					{rated.length > 0 ? "media su " + rated.length + " voti" : "ancora nessun voto"}
					<br />
					{logs.length} {logs.length === 1 ? "persona c'era" : "persone c'erano"}
				</div>
			</div>

			<div className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">Recensioni</h2>
				{logs.filter((x) => x.review).length === 0 && (
					<p className="text-muted-foreground">Ancora nessuna recensione.</p>
				)}
				{logs
					.filter((x) => x.review)
					.map((x, i) => (
						<div key={i} className="rounded-lg border p-3">
							{x.rating != null && (
								<div className="font-medium">{x.rating}★</div>
							)}
							<p className="text-sm">{x.review}</p>
						</div>
					))}
			</div>
		</main>
	)
}