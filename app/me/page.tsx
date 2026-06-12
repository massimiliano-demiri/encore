"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { ConcertPoster } from "@/components/concert-poster"
import { PosterGridSkeleton } from "@/components/skeleton"
import { ProfileHeader } from "@/components/profile-header"
import { LogOut, Sparkles, Ticket } from "lucide-react"

type Profile = {
	id: string
	username: string | null
	display_name: string | null
	avatar_url: string | null
	bio: string | null
	city: string | null
}

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
	const [profile, setProfile] = useState<Profile | null>(null)
	const [logs, setLogs] = useState<Log[]>([])
	const [loadingLogs, setLoadingLogs] = useState(true)
	const [rsvpCount, setRsvpCount] = useState(0)

	useEffect(() => {
		if (!user) return
		const supabase = createClient()
		if (!supabase) return
		supabase
			.from("profiles")
			.select("id, username, display_name, avatar_url, bio, city")
			.eq("id", user.id)
			.maybeSingle()
			.then(({ data }) => {
				if (data && !data.username) {
					router.push("/onboarding")
					return
				}
				setProfile((data as unknown as Profile) ?? null)
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

		// Conta RSVP per concerti futuri
		supabase
			.from("rsvps")
			.select("concert_id")
			.eq("user_id", user.id)
			.then(async ({ data: rsvps }) => {
				if (!rsvps || rsvps.length === 0) { setRsvpCount(0); return }
				const ids = (rsvps as Array<{ concert_id: string }>).map((r) => r.concert_id)
				const today = new Date().toISOString().slice(0, 10)
				const { data: concerts } = await supabase
					.from("concerts")
					.select("id, date")
					.in("id", ids)
					.gte("date", today)
				setRsvpCount((concerts ?? []).length)
			})
	}, [user])

	const handleLogout = async () => {
		const supabase = createClient()
		if (!supabase) return
		await supabase.auth.signOut()
		router.push("/")
	}

	if (loading) return <main className="p-6">Carico…</main>
	if (!user)
		return (
			<main className="p-6">
				<Link href="/login" className="underline">
					Accedi
				</Link>{" "}
				per vedere i tuoi concerti.
			</main>
		)

	const year = new Date().getFullYear()

	return (
		<main className="pb-20 sm:pb-10">
			{profile && <ProfileHeader profile={profile} isOwner={true} />}

			<section className="mx-auto max-w-3xl px-6 pt-6">
				<h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/50">
					I miei concerti
				</h2>
				{loadingLogs ? (
					<PosterGridSkeleton />
				) : logs.length === 0 ? (
					<p className="text-white/60">
						Non hai ancora loggato nessun concerto.{" "}
						<Link href="/search" className="underline">
							Cerca un artista
						</Link>
						.
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
			</section>

			{/* Watchlist link */}
			{rsvpCount > 0 && (
				<section className="mx-auto max-w-3xl px-6 pt-6">
					<Link
						href="/me/rsvps"
						className="inline-flex items-center gap-2 text-sm text-[#FFC24B] transition hover:text-[#FFD84B]"
					>
						<Ticket className="h-4 w-4" />
						Parteciperò a {rsvpCount} {rsvpCount === 1 ? "concerto" : "concerti"}
					</Link>
				</section>
			)}

			{/* Wrapped + Logout */}
			{logs.length > 0 && (
				<section className="mx-auto max-w-3xl px-6 pt-10">
					<div className="border-t border-white/10 pt-6 flex items-center justify-between">
						<Link
							href={"/api/wrapped/" + user.id}
							target="_blank"
							className="inline-flex items-center gap-2 text-sm font-semibold text-[#FFC24B] transition hover:text-[#FFD84B]"
						>
							<Sparkles className="h-4 w-4" />
							Il mio Wrapped {year}
						</Link>
						<button
							onClick={handleLogout}
							className="inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
						>
							<LogOut className="h-4 w-4" />
							Esci
						</button>
					</div>
				</section>
			)}

			{logs.length === 0 && rsvpCount === 0 && (
				<section className="mx-auto max-w-3xl px-6 pt-12">
					<div className="border-t border-white/10 pt-6 flex justify-end">
						<button
							onClick={handleLogout}
							className="inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
						>
							<LogOut className="h-4 w-4" />
							Esci
						</button>
					</div>
				</section>
			)}
		</main>
	)
}