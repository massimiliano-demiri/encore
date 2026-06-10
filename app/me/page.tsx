"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { ConcertPoster } from "@/components/concert-poster"
import { PosterGridSkeleton } from "@/components/skeleton"

type Log = {
	id: string
	rating: number | null
	review: string | null
	concert_id: string
	concerts: {
		date: string | null
		artists: { name: string } | null
		venues: { name: string; city: string | null } | null
	} | null
}

export default function ProfilePage() {
	const { user, loading } = useUser()
	const router = useRouter()
	const [logs, setLogs] = useState<Log[]>([])
	const [loadingLogs, setLoadingLogs] = useState(true)

	useEffect(() => {
		if (!user) return
		const supabase = createClient()

		supabase
			.from("profiles")
			.select("username")
			.eq("id", user.id)
			.maybeSingle()
			.then(({ data }) => {
				if (data && !data.username) router.push("/onboarding")
			})

		supabase
			.from("logs")
			.select("id, rating, review, concert_id, concerts(date, artists(name), venues(name, city))")
			.eq("user_id", user.id)
			.order("logged_at", { ascending: false })
			.then(({ data }) => {
				setLogs((data as unknown as Log[]) ?? [])
				setLoadingLogs(false)
			})
	}, [user])

	if (loading) return <main className="p-6">Carico…</main>

	if (!user)
		return (
			<main className="p-6">
				<Link href="/login" className="underline">Accedi</Link> per vedere i tuoi concerti.
			</main>
		)

	return (
		<main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">I miei concerti</h1>
				<Link href="/settings" className="text-sm text-muted-foreground hover:underline">Modifica profilo</Link>
			</div>
			{loadingLogs ? (
				<PosterGridSkeleton />
			) : logs.length === 0 ? (
				<p>
					Non hai ancora loggato nessun concerto.{" "}
					<Link href="/search" className="underline">Cerca un artista</Link>.
				</p>
			) : (
				<div className="fade-in grid grid-cols-2 gap-3 sm:grid-cols-3">
					{logs.map((l) => (
						<ConcertPoster
							key={l.id}
							concertId={l.concert_id}
							artist={l.concerts?.artists?.name ?? "Artista"}
							rating={l.rating}
							subtitle={l.concerts?.venues?.city ?? l.concerts?.date ?? ""}
						/>
					))}
				</div>
			)}
		</main>
	)
}