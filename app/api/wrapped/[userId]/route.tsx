import { ImageResponse } from "next/og"
import { createClient } from "@supabase/supabase-js"

const rootStyle = {
	width: 1080,
	height: 1920,
	display: "flex",
	flexDirection: "column" as const,
	backgroundColor: "#0E0E12",
	color: "#F4F4F6",
	fontFamily: "sans-serif",
}

const bgGlowStyle = {
	position: "absolute" as const,
	top: 0,
	right: 0,
	width: 600,
	height: 600,
	borderRadius: "50%",
	background: "rgba(255,45,107,0.10)",
	filter: "blur(150px)",
}

const contentStyle = {
	display: "flex",
	flexDirection: "column" as const,
	justifyContent: "center" as const,
	alignItems: "center" as const,
	flex: 1,
	padding: 80,
	position: "relative" as const,
	zIndex: 1,
	textAlign: "center" as const,
	gap: 36,
}

const yearStyle = {
	fontSize: 38,
	fontWeight: 700,
	letterSpacing: "0.3em",
	color: "#FFC24B",
	textTransform: "uppercase" as const,
}

const titleStyle = {
	fontSize: 90,
	fontWeight: 800,
	lineHeight: 1.05,
	fontFamily: "Space Grotesk",
}

const subtitleStyle = {
	fontSize: 32,
	color: "#9A9AA7",
}

const statRowStyle = {
	display: "flex",
	gap: 70,
	justifyContent: "center" as const,
	marginTop: 10,
}

const statStyle = {
	display: "flex",
	flexDirection: "column" as const,
	alignItems: "center" as const,
}

const statNumberStyle = {
	fontSize: 72,
	fontWeight: 800,
	lineHeight: 1.0,
	fontFamily: "Space Grotesk",
}

const statNumberGoldStyle = {
	fontSize: 72,
	fontWeight: 800,
	lineHeight: 1.0,
	fontFamily: "Space Grotesk",
	color: "#FFC24B",
}

const statLabelStyle = {
	fontSize: 24,
	color: "#9A9AA7",
	marginTop: 6,
}

const topSectionStyle = {
	marginTop: 10,
	display: "flex",
	flexDirection: "column" as const,
	alignItems: "center" as const,
}

const topLabelStyle = {
	fontSize: 22,
	color: "#9A9AA7",
	textTransform: "uppercase" as const,
	letterSpacing: "0.2em",
}

const topValueStyle = {
	fontSize: 46,
	fontWeight: 800,
	fontFamily: "Space Grotesk",
	marginTop: 6,
}

const bottomStyle = {
	fontSize: 28,
	color: "#9A9AA7",
	marginTop: 40,
}

const wordmarkStyle = {
	fontSize: 28,
	fontWeight: 800,
	letterSpacing: "0.15em",
	color: "#9A9AA7",
	position: "absolute" as const,
	bottom: 60,
}

function getSupabaseAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !key) return null
	return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(
	_req: Request,
	context: { params: Promise<{ userId: string }> },
) {
	const { userId } = await context.params
	const supabase = getSupabaseAdmin()
	if (!supabase) return new Response("Server misconfigured", { status: 500 })

	const [{ data: logs }, { data: profile }] = await Promise.all([
		supabase
			.from("logs")
			.select("rating, concert:concerts(artist:artists(name), venue:venues(city))")
			.eq("user_id", userId),
		supabase
			.from("profiles")
			.select("display_name, username")
			.eq("id", userId)
			.maybeSingle(),
	])

	const rows = (logs ?? []) as unknown as Array<{
		rating: number | null
		concert: {
			artist: { name: string } | null
			venue: { city: string | null } | null
		} | null
	}>

	if (rows.length === 0) {
		return new Response("No concerts logged yet", { status: 404 })
	}

	const total = rows.length
	const rated = rows.filter((r) => r.rating != null)
	const avgRaw =
		rated.length > 0
			? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
			: 0
	const avg = avgRaw.toFixed(1)

	const artistFreq = new Map<string, number>()
	for (const r of rows) {
		const name = r.concert?.artist?.name
		if (name) artistFreq.set(name, (artistFreq.get(name) ?? 0) + 1)
	}
	const topArtist =
		[...artistFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"

	const cityFreq = new Map<string, number>()
	for (const r of rows) {
		const city = r.concert?.venue?.city
		if (city) cityFreq.set(city, (cityFreq.get(city) ?? 0) + 1)
	}
	const topCity =
		[...cityFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"

	const name = profile
		? ((profile as any).display_name || (profile as any).username || "Anonimo")
		: "Anonimo"
	const year = new Date().getFullYear()

	return new ImageResponse(
		<div style={rootStyle}>
			<div style={bgGlowStyle} />
			<div style={contentStyle}>
				<div style={yearStyle}>WRAPPED {year}</div>
				<div style={titleStyle}>{name.split(" ")[0]}</div>
				<div style={subtitleStyle}>il tuo anno di concerti</div>

				<div style={statRowStyle}>
					<div style={statStyle}>
						<div style={statNumberStyle}>{total}</div>
						<div style={statLabelStyle}>live</div>
					</div>
					<div style={statStyle}>
						<div style={statNumberGoldStyle}>{avg}</div>
						<div style={statLabelStyle}>media /5</div>
					</div>
				</div>

				<div style={topSectionStyle}>
					<div style={topLabelStyle}>Il tuo artista</div>
					<div style={topValueStyle}>{topArtist}</div>
				</div>

				<div style={topSectionStyle}>
					<div style={topLabelStyle}>La tua città</div>
					<div style={topValueStyle}>{topCity}</div>
				</div>

				<div style={bottomStyle}>
					encorelive.it/u/{((profile as any)?.username) || ""}
				</div>
			</div>
			<div style={wordmarkStyle}>ENCORE</div>
		</div>,
		{ width: 1080, height: 1920 },
	)
}