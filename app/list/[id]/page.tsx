"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { ConcertPoster } from "@/components/concert-poster"
import { PosterGridSkeleton } from "@/components/skeleton"
import { Lock, Globe, X } from "lucide-react"

type ListRow = {
	id: string
	user_id: string
	title: string | null
	description: string | null
	is_public: boolean
}

type Item = {
	id: string
	concert_id: string
	concerts: {
		date: string | null
		artists: { name: string } | null
		venues: { name: string; city: string | null } | null
	} | null
}

export default function ListDetail() {
	const { id } = useParams<{ id: string }>()
	const { user } = useUser()
	const supabase = createClient()
	const [list, setList] = useState<ListRow | null>(null)
	const [items, setItems] = useState<Item[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			const { data: l } = await supabase
				.from("lists")
				.select("id, user_id, title, description, is_public")
				.eq("id", id)
				.maybeSingle()
			setList((l as unknown as ListRow) ?? null)
			if (l) {
				const { data } = await supabase
					.from("list_items")
					.select("id, concert_id, concerts(date, artists(name), venues(name, city))")
					.eq("list_id", id)
					.order("created_at", { ascending: false })
				setItems((data as unknown as Item[]) ?? [])
			}
			setLoading(false)
		}
		load()
	}, [id])

	const remove = async (itemId: string) => {
		await supabase.from("list_items").delete().eq("id", itemId)
		setItems((prev) => prev.filter((x) => x.id !== itemId))
	}

	if (loading)
		return (
			<main className="mx-auto max-w-2xl p-6">
				<PosterGridSkeleton />
			</main>
		)
	if (!list) return <main className="p-6">Lista non trovata.</main>

	const isOwner = user?.id === list.user_id

	return (
		<main className="mx-auto flex max-w-2xl flex-col gap-5 p-6">
			<div>
				<Link href="/lists" className="text-sm text-white/50 hover:text-white">← Le tue liste</Link>
				<div className="mt-2 flex items-center gap-2">
					<h1 className="text-2xl font-bold [font-family:var(--font-display)]">{list.title || "Senza titolo"}</h1>
					{list.is_public ? <Globe className="h-4 w-4 text-white/40" /> : <Lock className="h-4 w-4 text-white/40" />}
				</div>
				{list.description && <p className="mt-1 text-sm text-white/60">{list.description}</p>}
				<p className="mt-1 text-sm text-white/40">
					{items.length} {items.length === 1 ? "concerto" : "concerti"}
				</p>
			</div>

			{items.length === 0 ? (
				<p className="text-white/50">
					Lista vuota. {isOwner && "Aggiungi concerti dalla loro pagina (lo facciamo nel prossimo passo)."}
				</p>
			) : (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
					{items.map((it) => (
						<div key={it.id} className="relative">
							<ConcertPoster
								concertId={it.concert_id}
								artist={it.concerts?.artists?.name ?? "Artista"}
								rating={null}
								subtitle={it.concerts?.venues?.city ?? it.concerts?.date ?? ""}
							/>
							{isOwner && (
								<button
									onClick={() => remove(it.id)}
									className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur transition hover:bg-black/80 hover:text-white"
									aria-label="Rimuovi"
								>
									<X className="h-4 w-4" />
								</button>
							)}
						</div>
					))}
				</div>
			)}
		</main>
	)
}