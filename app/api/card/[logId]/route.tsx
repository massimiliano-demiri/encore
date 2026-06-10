import { ImageResponse } from "next/og"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const rootStyle = {
	width: 1080,
	height: 1920,
	display: "flex",
	flexDirection: "column" as const,
	justifyContent: "space-between",
	padding: 90,
	backgroundColor: "#0E0E12",
	backgroundImage: "linear-gradient(160deg, #17171F 0%, #0E0E12 55%, #1A0A12 100%)",
	color: "#F4F4F6",
	fontFamily: "sans-serif",
}
const topBarStyle = { display: "flex", alignItems: "center", justifyContent: "space-between" }
const wordmarkStyle = { display: "flex", fontSize: 44, fontWeight: 800, letterSpacing: "0.12em" }
const taglineStyle = { display: "flex", fontSize: 30, color: "#9A9AA7" }
const middleStyle = { display: "flex", flexDirection: "column" as const, gap: 24 }
const eyebrowStyle = { display: "flex", fontSize: 34, fontWeight: 700, letterSpacing: "0.3em", color: "#FF2D6B" }
const nameStyle = { display: "flex", fontSize: 120, fontWeight: 800, lineHeight: 1.02 }
const metaStyle = { display: "flex", flexDirection: "column" as const, gap: 10 }
const metaLineStyle = { display: "flex", fontSize: 42, color: "#9A9AA7" }
const starsStyle = { display: "flex", fontSize: 70, color: "#FFC24B", letterSpacing: "10px" }
const bottomStyle = { display: "flex", alignItems: "center", justifyContent: "space-between" }
const handleStyle = { display: "flex", fontSize: 42, fontWeight: 700 }

export async function GET(
	_req: Request,
	context: { params: Promise<{ logId: string }> },
) {
	const { logId } = await context.params

	const { data: log } = await supabase
		.from("logs")
		.select(
			"rating, concert:concerts(date, tour_name, artist:artists(name), venue:venues(name, city, country)), profile:profiles(username, display_name)",
		)
		.eq("id", logId)
		.maybeSingle()

	const row = log as unknown as {
		rating: number | null
		concert: {
			date: string | null
			tour_name: string | null
			artist: { name: string } | null
			venue: { name: string; city: string; country: string } | null
		} | null
		profile: { username: string | null; display_name: string | null } | null
	} | null

	if (!row) return new Response("Not found", { status: 404 })

	const aName = row.concert?.artist?.name ?? "Artista"
	const venue = row.concert?.venue
	const vLine = [venue?.name, venue?.city].filter(Boolean).join(" · ") || "Live"
	const d = row.concert?.date
	const dLine = d
		? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
		: ""
	const full = Math.round(Number(row.rating) || 0)
	const starStr = "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full)
	const who = row.profile?.username ? "@" + row.profile.username : row.profile?.display_name ?? ""

	return new ImageResponse(
		(
			<div style={rootStyle}>
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
		),
		{ width: 1080, height: 1920 },
	)
}