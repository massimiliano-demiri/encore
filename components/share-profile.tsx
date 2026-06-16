"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Share2, Copy, QrCode, Check, X } from "lucide-react"

export function ShareProfile({ username, displayName }: { username: string; displayName?: string }) {
	const [url, setUrl] = useState("")
	const [copied, setCopied] = useState(false)
	const [showQr, setShowQr] = useState(false)

	useEffect(() => {
		const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
		setUrl(origin + "/u/" + username + "?follow=1")
	}, [username])

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(url)
			setCopied(true)
			toast.success("Link copiato")
			setTimeout(() => setCopied(false), 2000)
		} catch { toast.error("Impossibile copiare il link") }
	}

	const share = async () => {
		const data = { title: "Encore", text: "Seguimi su Encore" + (displayName ? " — " + displayName : ""), url }
		if (typeof navigator !== "undefined" && navigator.share) {
			try { await navigator.share(data) } catch { /* annullato */ }
		} else { copy() }
	}

	const qrSrc = url ? "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=" + encodeURIComponent(url) : ""

	return (
		<div className="flex flex-wrap items-center gap-2">
			<button onClick={share} className="inline-flex items-center gap-1.5 bg-[#FF2D6B] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110">
				<Share2 className="h-4 w-4" /> Condividi profilo
			</button>
			<button onClick={copy} aria-label="Copia link" className="inline-flex items-center gap-1.5 border border-white/15 px-3 py-2 text-sm font-medium text-white/60 transition hover:border-white/40 hover:text-white">
				{copied ? <Check className="h-4 w-4 text-[#FFC24B]" /> : <Copy className="h-4 w-4" />}
				{copied ? "Copiato" : "Copia link"}
			</button>
			<button onClick={() => setShowQr(true)} aria-label="Mostra QR code" className="inline-flex items-center gap-1.5 border border-white/15 px-3 py-2 text-sm font-medium text-white/60 transition hover:border-white/40 hover:text-white">
				<QrCode className="h-4 w-4" /> QR
			</button>

			{showQr && (
				<div onClick={() => setShowQr(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
					<div onClick={(e) => e.stopPropagation()} className="relative flex flex-col items-center gap-4 border border-white/10 bg-[#17171F] p-6">
						<button onClick={() => setShowQr(false)} aria-label="Chiudi" className="absolute right-3 top-3 text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
						<p className="text-sm font-semibold text-white [font-family:var(--font-display)]">Seguimi su Encore</p>
						{qrSrc && <img src={qrSrc} alt="QR code del profilo" className="h-[220px] w-[220px] rounded bg-white p-2" />}
						<p className="max-w-[220px] break-all text-center text-xs text-white/40">@{username}</p>
					</div>
				</div>
			)}
		</div>
	)
}