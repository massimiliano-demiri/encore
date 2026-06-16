import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { ArtistClient } from "./artist-client"

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://encored.app"

function getAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !key) return null
	return createClient(url, key)
}

async function getArtistMeta(mbid: string) {
	const admin = getAdmin()
	if (!admin) return null
	const { data } = await admin
		.from("artists")
		.select("name")
		.eq("mbid", mbid)
		.maybeSingle()
	return (data as unknown as { name: string } | null) ?? null
}

export async function generateMetadata(
	{ params }: { params: Promise<{ mbid: string }> },
): Promise<Metadata> {
	const { mbid } = await params
	const a = await getArtistMeta(mbid)
	if (!a) return { title: "Artista | Encore" }

	const name = a.name
	const title = name + " — concerti e recensioni | Encore"
	const description =
		"Tutti i concerti di " + name + " dal vivo: scalette, recensioni e voti della community su Encore."
	const url = SITE + "/artist/" + mbid
	const ogImage = SITE + "/api/og/artist/" + mbid

	return {
		title,
		description,
		alternates: { canonical: url },
		openGraph: {
			title,
			description,
			url,
			type: "article",
			images: [{ url: ogImage, width: 1200, height: 630 }],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [ogImage],
		},
	}
}

export default async function Page({ params }: { params: Promise<{ mbid: string }> }) {
	const { mbid } = await params
	const a = await getArtistMeta(mbid)
	const name = a?.name ?? "Artista"

	let ldHtml = undefined
	if (a) {
		const jsonLd = {
			"@context": "https://schema.org",
			"@type": "MusicGroup",
			name,
			url: SITE + "/artist/" + mbid,
		}
		ldHtml = { __html: JSON.stringify(jsonLd) }
	}

	return (
		<>
			{ldHtml && <script type="application/ld+json" dangerouslySetInnerHTML={ldHtml} />}
			<ArtistClient mbid={mbid} />
		</>
	)
}