"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

type Artist = { mbid: string; name: string; hint?: string }

export function ArtistSearch() {
	const router = useRouter()
	const [q, setQ] = useState("")
	const [results, setResults] = useState<Artist[]>([])
	const [open, setOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const boxRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const term = q.trim()
		if (term.length < 2) {
			setResults([])
			return
		}
		const controller = new AbortController()
		const t = setTimeout(async () => {
			setLoading(true)
			try {
				const res = await fetch("/api/search-artists?q=" + encodeURIComponent(term), {
					signal: controller.signal,
				})
				const data = await res.json()
				const list = Array.isArray(data) ? data : (data.artists ?? data.results ?? [])
				const norm: Artist[] = list.map((a: Record<string, unknown>) => ({
					mbid: String(a.mbid ?? a.id ?? ""),
					name: String(a.name ?? ""),
					hint: (a.disambiguation as string) || (a.country as string) || "",
				}))
				setResults(norm.filter((a) => a.mbid && a.name))
				setOpen(true)
			} catch {
				// richiesta annullata o errore: ignora
			} finally {
				setLoading(false)
			}
		}, 350)
		return () => {
			clearTimeout(t)
			controller.abort()
		}
	}, [q])

	useEffect(() => {
		const onClick = (e: MouseEvent) => {
			if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
		}
		document.addEventListener("mousedown", onClick)
		return () => document.removeEventListener("mousedown", onClick)
	}, [])

	const go = (mbid: string) => {
		setOpen(false)
		router.push("/artist/" + mbid)
	}

	return (
		<div ref={boxRef} className="relative w-full max-w-md">
			<input
				value={q}
				onChange={(e) => setQ(e.target.value)}
				onFocus={() => results.length > 0 && setOpen(true)}
				placeholder="Cerca un artista…"
				className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-[#FF2D6B]"
			/>
			{open && q.trim().length >= 2 && (
				<ul className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-white/10 bg-[#17171F] py-1 shadow-xl">
					{loading && results.length === 0 ? (
						<li className="px-4 py-2 text-sm text-muted-foreground">Cerco…</li>
					) : results.length === 0 ? (
						<li className="px-4 py-2 text-sm text-muted-foreground">Nessun artista trovato</li>
					) : (
						results.map((a) => (
							<li key={a.mbid}>
								<button
									type="button"
									onClick={() => go(a.mbid)}
									className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-white/5"
								>
									<span className="text-sm font-medium">{a.name}</span>
									{a.hint && <span className="text-xs text-muted-foreground">{a.hint}</span>}
								</button>
							</li>
						))
					)}
				</ul>
			)}
		</div>
	)
}