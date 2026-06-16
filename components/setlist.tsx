"use client"

import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"

type Song = { name: string; encore: boolean }

export function Setlist({ mbid, date }: { mbid: string | null; date: string | null }) {
	const [songs, setSongs] = useState<Song[]>([])
	const [loading, setLoading] = useState(true)
	const [artistName, setArtistName] = useState("")

	useEffect(() => {
		if (!mbid || !date) { setLoading(false); return }
		fetch("/api/setlist?mbid=" + mbid + "&date=" + date)
			.then((r) => r.json())
			.then((d) => {
				setSongs(d.songs ?? [])
				setArtistName(d.artist ?? "")
			})
			.catch(() => setSongs([]))
			.finally(() => setLoading(false))
	}, [mbid, date])

	const youtubeSearchUrl = (songName: string): string => {
		const query = encodeURIComponent((artistName + " " + songName).trim())
		return "https://www.youtube.com/results?search_query=" + query
	}

	if (loading) return <p className="text-sm text-white/40">Cerco la scaletta…</p>
	if (songs.length === 0)
		return <p className="text-sm text-white/40">Scaletta non disponibile per questa data.</p>

	let n = 0

	return (
		<ol className="flex flex-col gap-0.5">
			{songs.map((s, i) => {
				if (!s.encore) n++
				return (
					<li key={i} className="group flex items-center gap-2 py-1.5 border-l-2 border-transparent hover:border-[#FF2D6B]/30 hover:bg-white/[0.02] -ml-3 pl-3 transition">
						{s.encore ? (
							<span className="w-7 shrink-0 text-[10px] font-bold uppercase text-[#FFC24B]">BIS</span>
						) : (
							<span className="w-7 shrink-0 text-right text-xs text-white/30">{n}</span>
						)}
						<span className="flex-1 text-sm text-white/80">{s.name}</span>
						<a
							href={youtubeSearchUrl(s.name)}
							target="_blank"
							rel="noopener"
							className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-white/25 hover:text-[#FF2D6B] hover:bg-white/[0.05] active:scale-95 transition"
							aria-label={"Cerca " + s.name + " su YouTube"}
							title={"Cerca su YouTube: " + artistName + " - " + s.name}
						>
							<ExternalLink className="h-3 w-3" />
						</a>
					</li>
				)
			})}
		</ol>
	)
}