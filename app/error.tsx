"use client"

import { useEffect } from "react"
import Link from "next/link"
import { RotateCw, Home, AlertTriangle } from "lucide-react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		// In produzione potresti loggare su un servizio esterno (Sentry, ecc.)
		console.error(error)
	}, [error])

	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-center">
			<div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FF2D6B]/20 blur-[130px]" />
			<div className="relative w-full max-w-sm">
				<div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#FF2D6B]/30 bg-[#FF2D6B]/10">
					<AlertTriangle className="h-6 w-6 text-[#FF2D6B]" />
				</div>
				<h1 className="text-2xl font-bold [font-family:var(--font-display)]">Qualcosa è andato storto</h1>
				<p className="mt-2 text-sm text-white/50">
					C'è stato un intoppo nel caricare questa pagina. Riprova, di solito basta.
				</p>
				{error?.digest && <p className="mt-2 text-xs text-white/25">Codice: {error.digest}</p>}
				<div className="mt-6 flex flex-wrap items-center justify-center gap-2">
					<button onClick={reset} className="inline-flex items-center gap-1.5 rounded-full bg-[#FF2D6B] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110">
						<RotateCw className="h-4 w-4" /> Riprova
					</button>
					<Link href="/" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/5">
						<Home className="h-4 w-4" /> Torna alla home
					</Link>
				</div>
			</div>
		</main>
	)
}