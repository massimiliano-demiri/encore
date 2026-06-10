"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"

export function ShareCardButton({ logId }: { logId: string }) {
	const [loading, setLoading] = useState(false)

	async function onShare() {
		setLoading(true)
		try {
			const res = await fetch("/api/card/" + logId)
			const blob = await res.blob()
			const file = new File([blob], "encore.png", { type: "image/png" })
			const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }
			if (nav.canShare && nav.canShare({ files: [file] })) {
				await nav.share({ files: [file], title: "Encore" })
			} else {
				const url = URL.createObjectURL(blob)
				const a = document.createElement("a")
				a.href = url
				a.download = "encore.png"
				a.click()
				URL.revokeObjectURL(url)
			}
		} catch {
			// ignora
		} finally {
			setLoading(false)
		}
	}

	return (
		<button
			onClick={onShare}
			disabled={loading}
			className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/80 transition hover:text-white disabled:opacity-50"
		>
			<Share2 className="h-4 w-4" /> {loading ? "Genero…" : "Condividi"}
		</button>
	)
}