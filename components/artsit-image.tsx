"use client"

import { useEffect, useState } from "react"

function hueFromString(s: string) {
	let h = 0
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
	return h
}

export function ArtistImage({
	name,
	mbid,
	className = "",
}: {
	name: string
	mbid?: string
	className?: string
}) {
	const [src, setSrc] = useState<string | null>(null)

	useEffect(() => {
		if (!name && !mbid) return
		const params = new URLSearchParams()
		if (mbid) params.set("mbid", mbid)
		if (name) params.set("q", name)
		fetch("/api/artist-image?" + params.toString())
			.then((r) => r.json())
			.then((d) => setSrc(d.image ?? null))
			.catch(() => setSrc(null))
	}, [name, mbid])

	const hue = hueFromString(name || "x")
	const gradientStyle = {
		backgroundImage:
			"linear-gradient(135deg, hsl(" + hue + " 70% 45%), hsl(" + ((hue + 40) % 360) + " 70% 22%))",
	}

	if (src) {
		return <img src={src} alt={name} className={"object-cover " + className} />
	}

	return (
		<div
			style={gradientStyle}
			className={"flex items-center justify-center font-bold text-white/90 " + className}
		>
			{(name || "?").charAt(0).toUpperCase()}
		</div>
	)
}