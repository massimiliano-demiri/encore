"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { Search, ChevronRight, Music } from "lucide-react"
import { ArtistImage } from "@/components/artsit-image"

type Artist = { mbid: string; name: string; info: string }

export default function WelcomePage() {
	const { user, loading: userLoading } = useUser()
	const supabase = createClient()
	const router = useRouter()
	const [q, setQ] = useState("")
	const [results, setResults] = useState<Artist[]>([])
	const [loading, setLoading] = useState(false)
	const [loggedFirst, setLoggedFirst] = useState(false)
	const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

	useEffect(() => {
		if (!userLoading && !user) router.push("/login")
	}, [userLoading, user])

	const search = async (term: string) => {
		if (!term.trim() || term.trim().length < 2) { setResults([]); return }
		setLoading(true)
		try {
			const res = await fetch("/api/search-artists?q=" + encodeURIComponent(term))
			if (res.ok) { const data = await res.json(); setResults(data.artists ?? []) }
			else setResults([])
		} catch { setResults([]) }
		setLoading(false)
	}

	const handleChange = (value: string) => {
		setQ(value)
		if (timerRef.current) clearTimeout(timerRef.current)
		timerRef.current = setTimeout(() => search(value), 300)
	}

	if (userLoading) return <main className="p-6">Carico…</main>
	if (!user) return null

	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
			<div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#7A5CFF]/15 blur-[130px]" />
			<div className="pointer-events-none absolute right-0 bottom-1/4 h-48 w-48 translate-x-1/3 rounded-full bg-[#FF2D6B]/10 blur-[100px]" />

			<div className="relative w-full max-w-lg">
				<div className="mb-10 text-center">
					<div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF2D6B] to-[#7A5CFF]">
						<Music className="h-8 w-8 text-white" />
					</div>
					<h1 className="text-3xl font-bold [font-family:var(--font-display)]">Benvenut{user.user_metadata?.display_name ? "a" : "o"} su Encore</h1>
					<p className="mt-3 text-base text-white/50">
						Inizia a costruire il diario dei tuoi concerti. Cerca il primo artista che hai visto dal vivo.
					</p>
				</div>

				{/* Barra ricerca */}
				<div className="mb-6 relative">
					<Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
					<input
						value={q}
						onChange={(e) => handleChange(e.target.value)}
						placeholder="Cerca un artista… (es. Radiohead, Vasco, Coldplay)"
						autoComplete="off"
						className="w-full border-b-2 border-white/15 bg-transparent py-4 pl-12 pr-4 text-lg outline-none transition placeholder:text-white/20 focus:border-[#FF2D6B]"
					/>
				</div>

				{/* Risultati */}
				{loading && <p className="text-sm text-white/30 text-center">Cerco…</p>}

				{results.length > 0 && (
					<div className="flex flex-col gap-1 mb-6">
						{results.slice(0, 6).map((a) => (
							<Link
								key={a.mbid}
								href={"/artist/" + a.mbid}
								className="flex items-center gap-4 border-l-2 border-white/10 bg-white/[0.02] py-3 pl-4 pr-3 transition hover:border-[#FF2D6B]/40 hover:bg-white/[0.04]"
							>
								<div className="h-12 w-10 shrink-0 overflow-hidden">
									<ArtistImage name={a.name} mbid={a.mbid} className="h-full w-full" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-semibold text-white [font-family:var(--font-display)]">{a.name}</p>
									{a.info && <p className="text-xs text-white/40">{a.info}</p>}
								</div>
								<ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
							</Link>
						))}
					</div>
				)}

				{/* Link saltare */}
				<div className="text-center">
					<Link href="/me" className="text-sm text-white/30 hover:text-white/60 transition">
    Voglio andare direttamente al mio diario →
</Link>
				</div>
			</div>
		</main>
	)
}