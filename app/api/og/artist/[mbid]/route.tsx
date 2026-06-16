import { ImageResponse } from "next/og"
import { createClient } from "@supabase/supabase-js"

const rootStyle = {
	width: 1200,
	height: 630,
	display: "flex",
	flexDirection: "column" as const,
	backgroundColor: "#0E0E12",
	color: "#F4F4F6",
	fontFamily: "sans-serif",
}

const bgGlowStyle = {
	position: "absolute" as const,
	top: -100,
	left: -100,
	width: 500,
	height: 500,
	borderRadius: "50%",
	background: "rgba(122,92,255,0.10)",
	filter: "blur(120px)",
}

const contentStyle = {
	display: "flex",
	flexDirection: "column" as const,
	justifyContent: "center" as const,
	flex: 1,
	padding: "80px 100px",
	position: "relative" as const,
	zIndex: 1,
	gap: 16,
}

const eyebrowStyle = {
	fontSize: 24,
	fontWeight: 700,
	letterSpacing: "0.3em",
	color: "#FF2D6B",
	textTransform: "uppercase" as const,
}

const nameStyle = {
	fontSize: 80,
	fontWeight: 800,
	lineHeight: 1.05,
	fontFamily: "Space Grotesk",
}

const metaStyle = {
	fontSize: 32,
	color: "#9A9AA7",
}

const bottomBarStyle = {
	display: "flex",
	justifyContent: "space-between" as const,
	alignItems: "center" as const,
	padding: "30px 100px",
	borderTop: "1px solid rgba(255,255,255,0.08)",
}

const wordmarkStyle = {
	fontSize: 28,
	fontWeight: 800,
	letterSpacing: "0.12em",
}

const taglineStyle = {
	fontSize: 22,
	color: "#9A9AA7",
}

function getAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !key) return null
	return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(
	_req: Request,
	context: { params: Promise<{ mbid: string }> },
) {
	const { mbid } = await context.params
	const admin = getAdmin()
	if (!admin) return new Response("Server error", { status: 500 })

	const { data } = await admin
		.from("artists")
		.select("name")
		.eq("mbid", mbid)
		.maybeSingle()

	const row = data as unknown as { name: string } | null
	const artist = row?.name ?? "Artista"

	return new ImageResponse(
		<div style={rootStyle}>
			<div style={bgGlowStyle} />
			<div style={contentStyle}>
				<div style={eyebrowStyle}>Artista</div>
				<div style={nameStyle}>{artist}</div>
				<div style={metaStyle}>
					Concerti, scalette e recensioni su Encore
				</div>
			</div>
			<div style={bottomBarStyle}>
				<div style={wordmarkStyle}>
					Enc<span>o</span>re
				</div>
				<div style={taglineStyle}>Ogni live, per sempre.</div>
			</div>
		</div>,
		{ width: 1200, height: 630 },
	)
}