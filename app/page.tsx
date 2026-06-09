"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function HomePage() {
	const [q, setQ] = useState("")
	const router = useRouter()

	const go = () => {
		if (q.trim()) router.push("/search?q=" + encodeURIComponent(q.trim()))
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0E0E12] p-6 text-white">
			<div className="flex flex-col items-center gap-2 text-center">
				<h1 className="text-5xl font-bold tracking-tight">Encore</h1>
				<p className="text-lg text-white/60">Ogni live, per sempre.</p>
			</div>
			<div className="flex w-full max-w-md gap-2">
				<Input
					value={q}
					onChange={(e) => setQ(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && go()}
					placeholder="Cerca un artista…"
					className="border-white/15 bg-white/5 text-white placeholder:text-white/40"
				/>
				<Button onClick={go} className="bg-[#FF2D6B] text-white hover:bg-[#FF2D6B]/90">
					Cerca
				</Button>
			</div>
			<a href="/me" className="text-sm text-white/50 underline">
				I miei concerti
			</a>
		</main>
	)
}