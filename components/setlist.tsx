"use client"

import { useEffect, useState } from "react"

type Song = { name: string; encore: boolean }

export function Setlist({ mbid, date }: { mbid: string | null; date: string | null }) {
	const [songs, setSongs] = useState<Song[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!mbid || !date) {
			setLoading(false)
			return
		}
		fetch("/api/setlist?mbid=" + mbid + "&date=" + date)
			.then((r) => r.json())
			.then((d) => setSongs(d.songs ?? []))
			.catch(() => setSongs([]))
			.finally(() => setLoading(false))
	}, [mbid, date])

	if (loading) return <p className="text-sm text-muted-foreground">Cerco la scaletta…</p>
	if (songs.length === 0)
		return <p className="text-sm text-muted-foreground">Scaletta non disponibile per questa data.</p>

	let n = 0
	return (
		<ol className="flex flex-col gap-1">
			{songs.map((s, i) => {
				if (!s.encore) n++
				return (
					<li key={i} className="flex items-baseline gap-2 text-sm">
						{s.encore ? (
							<span className="text-xs font-semibold text-[#FFC24B]">BIS</span>
						) : (
							<span className="w-5 shrink-0 text-right text-muted-foreground">{n}</span>
						)}
						<span>{s.name}</span>
					</li>
				)
			})}
		</ol>
	)
}