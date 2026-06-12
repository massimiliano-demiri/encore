"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { Calendar, MapPin, ArrowLeft, Ticket } from "lucide-react"

type RsvpConcert = {
	id: string
	date: string | null
	concerts: {
		id: string
		date: string | null
		artists: { name: string; mbid: string | null } | null
		venues: { name: string; city: string | null } | null
	} | null
}

const fmtDate = (d: string | null) =>
	d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : ""

export default function RsvpsPage() {
	const { user } = useUser()
	const supabase = createClient()
	const [rsvps, setRsvps] = useState<RsvpConcert[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			if (!supabase || !user) { setLoading(false); return }
			const today = new Date().toISOString().slice(0, 10)

			const { data } = await supabase
				.from("rsvps")
				.select("id, date:concerts!rsvps_concert_id_fkey(date), concerts(id, date, artists(name, mbid), venues(name, city))")
				.eq("user_id", user.id)
				.order("date", { referencedTable: "concerts", ascending: true })

			const all = (data as unknown as RsvpConcert[]) ?? []

			// Filtra solo concerti futuri (che sono quelli a cui partecipi)
			const future = all.filter((r) => r.concerts?.date && r.concerts.date >= today)

			setRsvps(future)
			setLoading(false)
		}
		load()
	}, [user, supabase])

	if (!user) return <main className="mx-auto max-w-2xl p-6">Accedi per vedere i tuoi concerti.</main>
	if (loading) return <main className="mx-auto max-w-2xl p-6">Carico…</main>

	return (
		<main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
			<Link href="/me" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition mb-6">
				<ArrowLeft className="h-3.5 w-3.5" /> Torna al diario
			</Link>

			<div className="mb-6 flex items-center gap-3">
				<div className="h-px w-6 bg-[#FFC24B]/40" />
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFC24B]">
					La mia watchlist
				</span>
			</div>
			<h1 className="mb-6 text-2xl font-bold [font-family:var(--font-display)]">
				Parteciperò
			</h1>

			{rsvps.length === 0 ? (
				<div className="border border-white/10 bg-white/[0.02] p-10 text-center">
					<Ticket className="mx-auto mb-3 h-8 w-8 text-white/20" />
					<p className="text-white/40">
						Nessun concerto in programma. Usa il tasto "Parteciperò" sui concerti futuri per aggiungerli qui.
					</p>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{rsvps.map((r) => {
						const c = r.concerts
						if (!c) return null
						return (
							<Link
								key={r.id}
								href={"/concert/" + c.id}
								className="group flex items-center gap-4 border-l-2 border-[#FFC24B]/20 bg-white/[0.02] py-4 pl-5 transition hover:border-[#FFC24B]/50 hover:bg-white/[0.04]"
							>
								<div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#17171F] text-[#FFC24B]">
									<Calendar className="h-5 w-5" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-semibold text-white group-hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">
										{c.artists?.name ?? "Artista"}
									</p>
									<p className="text-sm text-white/50">
										<MapPin className="inline h-3.5 w-3.5 mr-1" />
										{c.venues?.name}
										{c.venues?.city ? ", " + c.venues.city : ""}
									</p>
									<p className="mt-1 text-xs text-white/40">
										<Calendar className="inline h-3 w-3 mr-1" />
										{fmtDate(c.date)}
									</p>
								</div>
							</Link>
						)
					})}
				</div>
			)}
		</main>
	)
}