import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://encorelive.it"

function getAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !key) return null
	return createClient(url, key)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const staticRoutes: MetadataRoute.Sitemap = [
		{ url: SITE, priority: 1 },
		{ url: SITE + "/search", priority: 0.6 },
	]

	const admin = getAdmin()
	if (!admin) return staticRoutes

	const { data: concerts } = await admin.from("concerts").select("id").limit(5000)
	const { data: artists } = await admin
		.from("artists")
		.select("mbid")
		.not("mbid", "is", null)
		.limit(5000)
	const { data: profiles } = await admin
		.from("profiles")
		.select("username")
		.not("username", "is", null)
		.limit(5000)

	const concertRoutes: MetadataRoute.Sitemap = (concerts ?? []).map((c) => ({
		url: SITE + "/concert/" + (c as { id: string }).id,
		changeFrequency: "weekly",
		priority: 0.8,
	}))

	const artistRoutes: MetadataRoute.Sitemap = (artists ?? []).map((a) => ({
		url: SITE + "/artist/" + (a as { mbid: string }).mbid,
		changeFrequency: "weekly",
		priority: 0.7,
	}))

	const profileRoutes: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
		url: SITE + "/u/" + (p as { username: string }).username,
		changeFrequency: "weekly",
		priority: 0.5,
	}))

	return [...staticRoutes, ...concertRoutes, ...artistRoutes, ...profileRoutes]
}