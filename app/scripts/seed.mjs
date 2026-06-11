import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// --- recensori seed (seed editoriale, non persone reali) ---
const reviewers = [
	{ email: "seed.marta@encored.app", username: "martagasp", displayName: "Marta Gasparini", bio: "Colleziono biglietti dal 2009.", city: "Milano" },
	{ email: "seed.luca@encored.app", username: "lucariverbero", displayName: "Luca Bevilacqua", bio: "Post-rock e troppe casse.", city: "Bologna" },
	{ email: "seed.elena@encored.app", username: "eledistorta", displayName: "Elena Conti", bio: "Se non fischiano le orecchie non era un concerto.", city: "Roma" },
	{ email: "seed.davide@encored.app", username: "ildrummer", displayName: "Davide Neri", bio: "Guardo sempre il batterista.", city: "Torino" },
	{ email: "seed.franci@encored.app", username: "francionstage", displayName: "Francesca Lo Verde", bio: "Firenze, palchi e vinili.", city: "Firenze" },
	{ email: "seed.giulio@encored.app", username: "giuvox", displayName: "Giulio Amato", bio: "Cresciuto a pane e Pino Daniele.", city: "Napoli" },
	{ email: "seed.sara@encored.app", username: "sarettalive", displayName: "Sara Bianchi", bio: "Arena-dipendente.", city: "Verona" },
	{ email: "seed.matteo@encored.app", username: "matteofuzz", displayName: "Matteo Rinaldi", bio: "Chitarre e feedback.", city: "Milano" },
	{ email: "seed.chiara@encored.app", username: "chiarawave", displayName: "Chiara De Santis", bio: "Synth, nebbia, bassi.", city: "Bari" },
	{ email: "seed.tommaso@encored.app", username: "tommybootleg", displayName: "Tommaso Greco", bio: "Registro tutto (male).", city: "Genova" },
	{ email: "seed.vale@encored.app", username: "valeencore", displayName: "Valentina Marchetti", bio: "Prima fila o niente.", city: "Padova" },
	{ email: "seed.stefano@encored.app", username: "stelowfi", displayName: "Stefano Riva", bio: "Indie e pioggia.", city: "Trieste" },
]

// --- concerti iconici + recensioni ---
const concerts = [
	{
		artist: "Radiohead",
		venue: { name: "Glastonbury Festival", city: "Pilton", country: "Regno Unito" },
		date: "1997-06-28",
		tour: "OK Computer",
		reviews: [
			{ by: "lucariverbero", rating: 5.0, text: "Il concerto che ha trasformato un festival fangoso in una cattedrale. 'Paranoid Android' sotto la pioggia è ancora il metro con cui giudico ogni live." },
			{ by: "martagasp", rating: 4.5, text: "Thom Yorke combatte col palco e con se stesso per tutto il set. Caotico, teso, irripetibile." },
		],
	},
	{
		artist: "Pink Floyd",
		venue: { name: "Canale della Giudecca", city: "Venezia", country: "Italia" },
		date: "1989-07-15",
		tour: "A Momentary Lapse of Reason",
		reviews: [
			{ by: "ildrummer", rating: 5.0, text: "Un palco galleggiante davanti a San Marco. Il suono rimbalzava sull'acqua e sulle pietre: più che un concerto, un evento che la città non ha mai davvero perdonato né dimenticato." },
		],
	},
	{
		artist: "Queen",
		venue: { name: "Wembley Stadium", city: "Londra", country: "Regno Unito" },
		date: "1986-07-12",
		tour: "Magic Tour",
		reviews: [
			{ by: "sarettalive", rating: 5.0, text: "72.000 persone dirette come un'orchestra da un solo uomo. Il momento del 'Ay-Oh' è la definizione stessa di carisma." },
			{ by: "valeencore", rating: 5.0, text: "Ho visto centinaia di live: nessuno ha mai posseduto uno stadio come Freddie quella sera." },
		],
	},
	{
		artist: "Massive Attack",
		venue: { name: "Mandela Forum", city: "Firenze", country: "Italia" },
		date: "2016-02-12",
		tour: "Ritual Spirit",
		reviews: [
			{ by: "francionstage", rating: 4.5, text: "Bassi che ti entrano nello sterno e una scenografia di testi-LED che ti mette a disagio nel modo giusto. Firenze ha tenuto il fiato per tutta 'Angel'." },
			{ by: "chiarawave", rating: 4.0, text: "Più installazione politica che concerto. Freddo, ipnotico, bellissimo." },
		],
	},
	{
		artist: "Nirvana",
		venue: { name: "Reading Festival", city: "Reading", country: "Regno Unito" },
		date: "1992-08-30",
		tour: "",
		reviews: [
			{ by: "matteofuzz", rating: 5.0, text: "Cobain entra in sedia a rotelle per prendere in giro le voci sulla sua salute, poi fa a pezzi il palco. Punk fino al midollo." },
		],
	},
	{
		artist: "Daft Punk",
		venue: { name: "Coachella", city: "Indio", country: "Stati Uniti" },
		date: "2006-04-29",
		tour: "Alive",
		reviews: [
			{ by: "chiarawave", rating: 5.0, text: "La piramide. Il momento in cui la musica elettronica dal vivo è diventata uno spettacolo e non più due tizi dietro un laptop." },
			{ by: "stelowfi", rating: 4.5, text: "Sono entrato scettico, sono uscito convertito. Punto e basta." },
		],
	},
	{
		artist: "Vasco Rossi",
		venue: { name: "Modena Park", city: "Modena", country: "Italia" },
		date: "2017-07-01",
		tour: "Modena Park",
		reviews: [
			{ by: "ildrummer", rating: 4.5, text: "225.000 persone che cantano ogni singola parola. Non sei a un concerto, sei dentro un pezzo di storia italiana." },
			{ by: "giuvox", rating: 4.0, text: "Scaletta lunghissima e qualche caduta di ritmo, ma l'atmosfera valeva il viaggio e le otto ore di coda." },
		],
	},
	{
		artist: "Fabrizio De André",
		venue: { name: "Teatro Brancaccio", city: "Roma", country: "Italia" },
		date: "1998-01-14",
		tour: "M'innamoravo di tutto",
		reviews: [
			{ by: "eledistorta", rating: 5.0, text: "L'ultimo tour. Lui seduto, la voce intatta, le parole che pesano il doppio sapendo come è andata. Mi sono commossa a 'Hotel Supramonte'." },
		],
	},
	{
		artist: "Pino Daniele",
		venue: { name: "Stadio San Paolo", city: "Napoli", country: "Italia" },
		date: "1981-09-19",
		tour: "",
		reviews: [
			{ by: "giuvox", rating: 5.0, text: "Napoli che canta blues in napoletano sotto un cielo di settembre. C'era tutta la città. Non si replica." },
		],
	},
	{
		artist: "David Bowie",
		venue: { name: "Wembley Arena", city: "Londra", country: "Regno Unito" },
		date: "1978-05-01",
		tour: "Isolar II",
		reviews: [
			{ by: "martagasp", rating: 4.5, text: "Il periodo berlinese portato dal vivo: luci fredde, niente fronzoli, 'Heroes' che spacca la sala in due." },
		],
	},
	{
		artist: "Arctic Monkeys",
		venue: { name: "Glastonbury Festival", city: "Pilton", country: "Regno Unito" },
		date: "2013-06-28",
		tour: "AM",
		reviews: [
			{ by: "matteofuzz", rating: 4.0, text: "Turner in versione rockstar imbrillantinata divide, ma il set è una macchina da guerra. 'R U Mine?' in apertura è una bomba." },
			{ by: "valeencore", rating: 4.5, text: "Headliner perfetto: vecchio garage e nuovo glam cuciti insieme senza un attimo di noia." },
		],
	},
	{
		artist: "The Cure",
		venue: { name: "Hyde Park", city: "Londra", country: "Regno Unito" },
		date: "2018-07-07",
		tour: "40 Live",
		reviews: [
			{ by: "stelowfi", rating: 4.5, text: "Due ore e mezza, 29 pezzi, Robert Smith che canta come nel 1989. Tramonto su 'Boys Don't Cry' e tutti che fingono di non piangere." },
		],
	},
	{
		artist: "Kendrick Lamar",
		venue: { name: "Coachella", city: "Indio", country: "Stati Uniti" },
		date: "2017-04-16",
		tour: "DAMN.",
		reviews: [
			{ by: "tommybootleg", rating: 4.5, text: "Headliner hip-hop che zittisce chi diceva che il rap non regge i grandi palchi. Regia e arti marziali sullo sfondo, flow impeccabile." },
		],
	},
	{
		artist: "LCD Soundsystem",
		venue: { name: "Madison Square Garden", city: "New York", country: "Stati Uniti" },
		date: "2011-04-02",
		tour: "The Long Goodbye",
		reviews: [
			{ by: "chiarawave", rating: 5.0, text: "Il (primo) concerto d'addio. Tre ore, palloncini ovunque, 'All My Friends' che diventa un funerale euforico. Catarsi pura." },
			{ by: "lucariverbero", rating: 4.5, text: "Raramente una band ha salutato con tanta classe. Poi sono tornati, ma quella sera era perfetta lo stesso." },
		],
	},
]

async function resolveMbid(name) {
	try {
		const res = await fetch(
			"https://musicbrainz.org/ws/2/artist?fmt=json&limit=1&query=" + encodeURIComponent(name),
			{ headers: { "User-Agent": "Encore-Seed/1.0 ( m.demiri@hotmail.it )" } },
		)
		if (!res.ok) return null
		const json = await res.json()
		const hit = json.artists && json.artists[0]
		return hit ? hit.id : null
	} catch {
		return null
	}
}

async function getOrCreateUser(email, password) {
	const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
	if (created.data && created.data.user) return created.data.user.id
	const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
	const found = list.data.users.find((u) => u.email === email)
	if (found) return found.id
	throw new Error("Utente non creato/trovato: " + email)
}

async function getVenueId(v) {
	const existing = await supabase.from("venues").select("id").eq("name", v.name).eq("city", v.city).maybeSingle()
	if (existing.data) return existing.data.id
	const ins = await supabase.from("venues").insert({ name: v.name, city: v.city, country: v.country }).select("id").single()
	return ins.data.id
}

async function getConcertId(artistId, venueId, date, tour) {
	const existing = await supabase.from("concerts").select("id").eq("artist_id", artistId).eq("venue_id", venueId).eq("date", date).maybeSingle()
	if (existing.data) return existing.data.id
	const ins = await supabase.from("concerts").insert({ artist_id: artistId, venue_id: venueId, date, tour_name: tour || null }).select("id").single()
	return ins.data.id
}

async function main() {
	// 1) artisti (mbid reali via MusicBrainz)
	const artistIds = new Map()
	const uniqueArtists = [...new Set(concerts.map((c) => c.artist))]
	for (const name of uniqueArtists) {
		const mbid = await resolveMbid(name)
		await sleep(1100) // rate limit MusicBrainz
		let id
		if (mbid) {
			const up = await supabase.from("artists").upsert({ mbid, name }, { onConflict: "mbid" }).select("id").single()
			id = up.data.id
		} else {
			const ins = await supabase.from("artists").insert({ name }).select("id").single()
			id = ins.data.id
		}
		artistIds.set(name, id)
		console.log("Artista:", name, mbid ? "(mbid ok)" : "(senza mbid)")
	}

	// 2) recensori -> auth user + profilo
	const userIds = new Map()
	for (const r of reviewers) {
		const uid = await getOrCreateUser(r.email, "Seed!" + Math.random().toString(36).slice(2, 10))
		await supabase.from("profiles").upsert(
			{ id: uid, username: r.username, display_name: r.displayName, bio: r.bio, city: r.city },
			{ onConflict: "id" },
		)
		userIds.set(r.username, uid)
		console.log("Profilo:", r.username)
	}

	// 3) concerti + recensioni
	for (const c of concerts) {
		const artistId = artistIds.get(c.artist)
		const venueId = await getVenueId(c.venue)
		const concertId = await getConcertId(artistId, venueId, c.date, c.tour)
		for (const rev of c.reviews) {
			const uid = userIds.get(rev.by)
			if (!uid) continue
			await supabase.from("logs").upsert(
				{ user_id: uid, concert_id: concertId, rating: rev.rating, review: rev.text, logged_at: new Date(c.date + "T20:00:00Z").toISOString() },
				{ onConflict: "user_id,concert_id" },
			)
		}
		console.log("Concerto:", c.artist, "@", c.venue.city)
	}

	console.log("\nSeed completato.")
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})