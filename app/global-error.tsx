"use client"

import { useEffect } from "react"
import type { CSSProperties } from "react"

const bodyStyle: CSSProperties = { margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0E0E12", color: "#F4F4F6", fontFamily: "system-ui, -apple-system, sans-serif", padding: 24 }
const wrapStyle: CSSProperties = { maxWidth: 360, textAlign: "center" }
const logoStyle: CSSProperties = { fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }
const accentStyle: CSSProperties = { color: "#FF2D6B" }
const titleStyle: CSSProperties = { marginTop: 20, fontSize: 20, fontWeight: 700 }
const textStyle: CSSProperties = { marginTop: 8, fontSize: 14, color: "rgba(244,244,246,0.5)", lineHeight: 1.5 }
const codeStyle: CSSProperties = { marginTop: 8, fontSize: 12, color: "rgba(244,244,246,0.25)" }
const btnStyle: CSSProperties = { marginTop: 24, border: "none", cursor: "pointer", borderRadius: 9999, background: "#FF2D6B", color: "#fff", padding: "10px 20px", fontSize: 14, fontWeight: 500 }

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<html lang="it">
			<body style={bodyStyle}>
				<div style={wrapStyle}>
					<div style={logoStyle}>
						Enc<span style={accentStyle}>o</span>re
					</div>
					<h1 style={titleStyle}>Errore critico</h1>
					<p style={textStyle}>L'app ha avuto un problema serio nel caricarsi. Prova a ricaricare.</p>
					{error?.digest && <p style={codeStyle}>Codice: {error.digest}</p>}
					<button onClick={reset} style={btnStyle}>Ricarica l'app</button>
				</div>
			</body>
		</html>
	)
}