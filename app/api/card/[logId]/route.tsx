import { ImageResponse } from "next/og"
import { createClient } from "@supabase/supabase-js"
import { readFile } from "node:fs/promises"
import path from "node:path"

// --- chiavi e costanti ---
const FANART_KEY = process.env.FANARTTV_API_KEY ?? "88eba8a755ab91f1db2b5316b252833e"

const FONT_PATH = path.join(process.cwd(), "public", "fonts", "space-grotesk-700.ttf")

// --- stili a livello modulo (no doppie graffe inline) ---
const rootStyle = {
	width: 1080,
	height: 1920,
	display: "flex",
	flexDirection: "column" as const,
	backgroundColor: "#0E0E12",
	color: "#F4F4F6",
}

const bgLayerStyle = {
	position: "absolute" as const,
	inset: 0,
	display: "flex",
}

const bgOverlayStyle = {
	position: "absolute" as const,
	inset: 0,
	backgroundImage:
		"linear-gradient(160deg, rgba(14,14,18,0.92) 0%, rgba(14,14,18,0.75) 55%, rgba(26,10,18,0.92) 100%)",
}

const contentLayerStyle = {
	display: "flex",
	flexDirection: "column" as const,
	justifyContent: "space-between" as const,
	padding: 90,
	flex: 1,
	position: "relative" as const,
	zIndex: 1,
}

const topBarStyle = { display: "flex", alignItems: "center", justifyContent: "space-between" }

const wordmarkStyle = {
	display: "flex",
	fontSize: 44,
	fontWeight: 800,
	letterSpacing: "0.12em",
	fontFamily: "Space Grotesk",
}

const taglineStyle = { display: "flex", fontSize: 30, color: "#9A9AA7" }

const middleStyle = { display: "flex", flexDirection: "column" as const, gap: 24, flex: 1, justifyContent: "center" as const }

const eyebrowStyle = {
	display: "flex",
	fontSize: 34,
	fontWeight: 700,
	letterSpacing: "0.3em",
	color: "#FF2D6B",
}

const nameStyle = {
	display: "flex",
	fontSize: 120,
	fontWeight: 800,
	lineHeight: 1.02,
	fontFamily: "Space Grotesk",
}

const metaStyle = { display: "flex", flexDirection: "column" as const, gap: 10 }

const metaLineStyle = { display: "flex", fontSize: 42, color: "#C0C0CC" }

const starsStyle = {
	display: "flex",
	fontSize: 70,
	color: "#FFC24B",
	letterSpacing: "10px",
}

const bottomStyle = {
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
}

const handleStyle = { display: "flex", fontSize: 42, fontWeight: 700 }

// --- supabase admin ---
function getSupabaseAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !serviceRoleKey) {
		throw new Error("supabase env missing: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY")
	}
	return createClient(url, serviceRoleKey, { auth: { persistSession: false } })
}

// --- fetch foto artista (stessa logica di artist-image) ---
async function getArtistImage(mbid: string | null | undefined): Promise<string | null> {
	if (!mbid) return null
	try {
		const res = await fetch("https://webservice.fanart.tv/v3/music/" + mbid + "?api_key=" + FANART_KEY)
		if (!res.ok) return null
		const data = await res.json()
		const thumbs = (data.artistthumb ?? []) as Array<{ url: string }>
		const backgrounds = (data.artistbackground ?? []) as Array<{ url: string }>
		return thumbs[0]?.url ?? backgrounds[0]?.url ?? null
	} catch {
		return null
	}
}

// --- route handler ---
export async function GET(_req: Request, context: { params: Promise<{ logId: string }> }) {
	const { logId } = await context.params
	const supabase = getSupabaseAdmin()

	const { data: log } = await supabase
		.from("logs")
		.select(
			"rating, concert:concerts(date, tour_name, artist:artists(name, mbid), venue:venues(name, city, country)), profile:profiles(username, display_name)",
		)
		.eq("id", logId)
		.maybeSingle()

	const row = log as unknown as {
		rating: number | null
		concert: {
			date: string | null
			tour_name: string | null
			artist: { name: string; mbid: string | null } | null
			venue: { name: string; city: string; country: string } | null
		} | null
		profile: { username: string | null; display_name: string | null } | null
	} | null

	if (!row) return new Response("Not found", { status: 404 })

	const aName = row.concert?.artist?.name ?? "Artista"
	const mbid = row.concert?.artist?.mbid ?? null
	const venue = row.concert?.venue
	const vLine = [venue?.name, venue?.city].filter(Boolean).join(" · ") || "Live"
	const d = row.concert?.date
	const dLine = d
		? new Date(d).toLocaleDateString("it-IT", {
				day: "numeric",
				month: "long",
				year: "numeric",
			})
		: ""
	const full = Math.round(Number(row.rating) || 0)
	const starStr = "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full)
	const who = row.profile?.username ? "@" + row.profile.username : row.profile?.display_name ?? ""

	// parallelo: font + foto artista
	const [fontData, artistImgUrl] = await Promise.all([
		readFile(FONT_PATH).catch(() => null),
		getArtistImage(mbid),
	])

	const bgImageStyle = artistImgUrl
		? {
				position: "absolute" as const,
				inset: 0,
				backgroundImage: "url(" + artistImgUrl + ")",
				backgroundSize: "cover" as const,
				backgroundPosition: "center" as const,
				opacity: 0.25,
			}
		: null

	const fonts: Array<{ name: string; data: ArrayBuffer; weight: 700; style: "normal" }> = []
	if (fontData) {
		fonts.push({ name: "Space Grotesk", data: fontData.buffer as ArrayBuffer, weight: 700, style: "normal" })
	}

	return new ImageResponse(
		<div style={rootStyle}>
			{/* sfondo: foto artista + gradiente sovrapposto */}
			<div style={bgLayerStyle}>
				{bgImageStyle && <div style={bgImageStyle} />}
				<div style={bgOverlayStyle} />
			</div>

			{/* contenuto */}
			<div style={contentLayerStyle}>
				<div style={topBarStyle}>
					<div style={wordmarkStyle}>ENCORE</div>
					<div style={taglineStyle}>Ogni live, per sempre.</div>
				</div>
				<div style={middleStyle}>
					<div style={eyebrowStyle}>C'ERO.</div>
					<div style={nameStyle}>{aName}</div>
					<div style={metaStyle}>
						<div style={metaLineStyle}>{vLine}</div>
						{dLine ? <div style={metaLineStyle}>{dLine}</div> : null}
					</div>
					{full > 0 ? <div style={starsStyle}>{starStr}</div> : null}
				</div>
				<div style={bottomStyle}>
					<div style={handleStyle}>{who}</div>
					<div style={taglineStyle}>encored.app</div>
				</div>
			</div>
		</div>,
		{ width: 1080, height: 1920, fonts: fonts.length > 0 ? fonts : undefined },
	)
}