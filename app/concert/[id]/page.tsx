import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { ConcertClient } from "./concert-client"

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://encored.app"

function getAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !key) return null
	return createClient(url, key)
}

type ConcertMeta = {
	date: string | null
	artists: { name: string } | null
	venues: { name: string; city: string | null; country: string | null } | null
	setlistfm_id: string | null
}

const fmt = (d: string | null) =>
	d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : ""

async function getConcert(id: string) {
	const admin = getAdmin()
	if (!admin) return null

	let { data } = await admin
		.from("concerts")
		.select("date, setlistfm_id, artists(name), venues(name, city, country)")
		.eq("id", id)
		.maybeSingle()

	if (!data) {
		const result = await admin
			.from("concerts")
			.select("date, setlistfm_id, artists(name), venues(name, city, country)")
			.eq("setlistfm_id", id)
			.maybeSingle()
		data = result.data
	}

	return (data as unknown as ConcertMeta) ?? null
}

export async function generateMetadata(
	{ params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
	const { id } = await params
	const c = await getConcert(id)
	if (!c) return { title: "Concerto | Encore" }

	const artist = c.artists?.name ?? "Artista"
	const place = [c.venues?.name, c.venues?.city].filter(Boolean).join(", ")
	const date = fmt(c.date)
	const title = [artist, place, date].filter(Boolean).join(" · ") + " | Encore"

	const isFuture = c.date ? new Date(c.date) > new Date() : false
	const description = isFuture
		? artist + " dal vivo" + (place ? " a " + place : "") + (date ? " il " + date : "") +
			". Dì che parteciperai e scopri chi altro ci sarà su Encore."
		: artist + " dal vivo" + (place ? " a " + place : "") + (date ? " il " + date : "") +
			". Voti, recensioni e scaletta su Encore."

	const url = SITE + "/concert/" + id
	return {
		title,
		description,
		alternates: { canonical: url },
		openGraph: { title, description, url, type: "article" },
		twitter: { card: "summary_large_image", title, description },
	}
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const c = await getConcert(id)
	const artist = c?.artists?.name ?? "Artista"
	const place = [c?.venues?.name, c?.venues?.city].filter(Boolean).join(", ")

	// Costruisci ticket URL se è un evento Ticketmaster
	const ticketUrl = c?.setlistfm_id
		? "https://www.ticketmaster.com/event/" + c.setlistfm_id
		: undefined

	let ldHtml = undefined
	if (c) {
		const isFuture = c.date ? new Date(c.date) > new Date() : false

		const jsonLd: any = {
			"@context": "https://schema.org",
			"@type": "MusicEvent",
			name: artist + (place ? " — " + place : ""),
			startDate: c.date ?? undefined,
			eventStatus: "https://schema.org/EventScheduled",
			eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
			performer: { "@type": "MusicGroup", name: artist },
			location: c.venues?.name
				? {
						"@type": "Place",
						name: c.venues.name,
						address: [c.venues.city, c.venues.country].filter(Boolean).join(", "),
					}
				: undefined,
		}

		// Schema Offers solo per concerti futuri con link Ticketmaster
		if (isFuture && ticketUrl) {
			jsonLd.offers = {
				"@type": "Offer",
				url: ticketUrl,
				availability: "https://schema.org/InStock",
			}
		}

		// BreadcrumbList
		const breadcrumb = {
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Home", item: SITE },
				{ "@type": "ListItem", position: 2, name: "Concerti", item: SITE + "/search" },
				{ "@type": "ListItem", position: 3, name: artist + (place ? " — " + place : ""), item: SITE + "/concert/" + id },
			],
		}

		const ldCombined = JSON.stringify([jsonLd, breadcrumb])
		ldHtml = { __html: ldCombined }
	}

	return (
		<>
			{ldHtml && <script type="application/ld+json" dangerouslySetInnerHTML={ldHtml} />}
			<ConcertClient id={id} />
		</>
	)
}