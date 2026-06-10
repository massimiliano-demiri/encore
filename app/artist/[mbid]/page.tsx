"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useUser } from "@/lib/use-user"
import { LogConcert } from "@/components/ui/log-concert"
import { ArtistImage } from "@/components/artsit-image"
import { Skeleton } from "@/components/skeleton"
import { ArrowLeft, MapPin, Calendar } from "lucide-react"

type Concert = {
	id: string
	date: string | null
	venue: string
	city: string
	country: string
}

const fmtDate = (d: string | null) => {
	if (!d) return "data sconosciuta"
	const t = new Date(d)
	return isNaN(t.getTime()) ? d : t.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
}

export default function ArtistPage() {
	const { mbid } = useParams<{ mbid: string }>()
	const { user } = useUser()
	const [artist, setArtist] = useState("")
	const [concerts, setConcerts] = useState<Concert[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetch("/api/artists/" + mbid + "/concerts")
			.then((r) => r.json())
			.then((d) => {
				setArtist(d.artist)
				setConcerts(d.concerts)
				setLoading(false)
			})
	}, [mbid])

	return (
		<main className="pb-10">
			<div className="relative h-64 w-full overflow-hidden">
				<ArtistImage name={artist} className="absolute inset-0 h-full w-full" />
				<div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] via-[#0E0E12]/60 to-transparent" />
				<Link
					href="/search"
					className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 text-sm text-white/80 backdrop-blur transition hover:text-white"
				>
					<ArrowLeft className="h-4 w-4" /> Cerca
				</Link>
				<div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl p-6">
					<p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#FF2D6B]">Artista</p>
					<h1 className="text-3xl font-bold text-white [font-family:var(--font-display)]">{artist || "Artista"}</h1>
				</div>
			</div>

			<div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
				<h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/50">
					Concerti
				</h2>

				{loading ? (
					<div className="flex flex-col gap-2">
						<Skeleton className="h-24 w-full rounded-2xl" />
						<Skeleton className="h-24 w-full rounded-2xl" />
						<Skeleton className="h-24 w-full rounded-2xl" />
					</div>
				) : concerts.length === 0 ? (
					<p className="text-white/50">Nessun concerto trovato.</p>
				) : (
					<ul className="fade-in flex flex-col gap-3">
						{concerts.map((c) => (
							<li key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
								<div className="font-medium">{c.venue}</div>
								<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/50">
									<span className="inline-flex items-center gap-1">
										<MapPin className="h-3.5 w-3.5" /> {c.city}
										{c.country ? ", " + c.country : ""}
									</span>
									<span className="inline-flex items-center gap-1">
										<Calendar className="h-3.5 w-3.5" /> {fmtDate(c.date)}
									</span>
								</div>
								{user ? (
									<div className="mt-3">
										<LogConcert concertId={c.id} />
									</div>
								) : (
									<Link href="/login" className="mt-3 inline-block text-sm text-white/60 underline hover:text-white">
										Accedi per dire "c'ero"
									</Link>
								)}
							</li>
						))}
					</ul>
				)}
			</div>
		</main>
	)
}