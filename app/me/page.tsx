"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"

type Log = {
	id: string
	rating: number | null
	review: string | null
	concerts: {
		date: string | null
		artists: { name: string } | null
		venues: { name: string; city: string | null } | null
	} | null
}

export default function ProfilePage() {
	const { user, loading } = useUser()
	const [logs, setLogs] = useState<Log[]>([])

	useEffect(() => {
		if (!user) return
		const supabase = createClient()
		supabase
			.from("logs")
			.select("id, rating, review, concerts(date, artists(name), venues(name, city))")
			.eq("user_id", user.id)
			.order("logged_at", { ascending: false })
.then(({ data }) => setLogs((data as unknown as Log[]) ?? []))	}, [user])

	if (loading) return <main className="p-6">Carico…</main>

	if (!user)
		return (
			<main className="p-6">
				<Link href="/login" className="underline">Accedi</Link> per vedere i tuoi concerti.
			</main>
		)

	return (
		<main className="mx-auto flex max-w-md flex-col gap-4 p-6">
			<h1 className="text-2xl font-bold">I miei concerti</h1>
			{logs.length === 0 ? (
				<p>
					Non hai ancora loggato nessun concerto.{" "}
					<Link href="/search" className="underline">Cerca un artista</Link>.
				</p>
			) : (
				<ul className="flex flex-col gap-2">
					{logs.map((l) => (
						<li key={l.id} className="rounded-lg border p-3">
							<div className="font-medium">{l.concerts?.artists?.name ?? "Artista"}</div>
							<div className="text-sm text-muted-foreground">
								{l.concerts?.venues?.name}
								{l.concerts?.venues?.city ? ", " + l.concerts.venues.city : ""}
								{" · "}
								{l.concerts?.date ?? ""}
							</div>
							{l.rating ? <div className="text-sm">{l.rating} ★</div> : null}
							{l.review ? <p className="mt-1 text-sm">{l.review}</p> : null}
						</li>
					))}
				</ul>
			)}
		</main>
	)
}