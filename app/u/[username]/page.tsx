import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { ProfileClient } from "./profile-client"

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://encored.app"

function getAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !key) return null
	return createClient(url, key)
}

type ProfileMeta = {
	id: string
	username: string | null
	display_name: string | null
	bio: string | null
	city: string | null
}

async function getProfile(username: string) {
	const admin = getAdmin()
	if (!admin) return null
	const { data } = await admin
		.from("profiles")
		.select("id, username, display_name, bio, city")
		.eq("username", username)
		.maybeSingle()
	return (data as unknown as ProfileMeta) ?? null
}

export async function generateMetadata(
	{ params }: { params: Promise<{ username: string }> },
): Promise<Metadata> {
	const { username } = await params
	const p = await getProfile(username)
	if (!p) return { title: "Profilo | Encore" }
	const name = p.display_name || p.username || "Profilo"
	const title = "Le recensioni di " + name + " su Encore"
	const description =
		p.bio ||
		name + " recensisce concerti dal vivo su Encore" + (p.city ? " da " + p.city : "") + "."
	const url = SITE + "/u/" + username
	return {
		title,
		description,
		alternates: { canonical: url },
		openGraph: { title, description, url, type: "profile" },
		twitter: { card: "summary", title, description },
	}
}

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
	const { username } = await params
	const p = await getProfile(username)
	const name = p?.display_name || p?.username || "Profilo"

	let ldHtml = undefined
	if (p) {
		const jsonLd = {
			"@context": "https://schema.org",
			"@type": "ProfilePage",
			mainEntity: {
				"@type": "Person",
				name,
				description: p.bio ?? undefined,
				address: p.city ?? undefined,
			},
		}
		ldHtml = { __html: JSON.stringify(jsonLd) }
	}

	return (
		<>
			{ldHtml && <script type="application/ld+json" dangerouslySetInnerHTML={ldHtml} />}
			<ProfileClient username={username} />
		</>
	)
}