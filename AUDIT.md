# AUDIT TECNICO — Encore

**Data audit**: 16 giugno 2026  
**Prodotto**: Encore v0.1.0  
**Stack**: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Supabase + Leaflet  
**Target**: App web mobile-first per il tracking di concerti dal vivo (Italia-first)

---

## 1. STATO ATTUALE DEL PROGETTO

### 1.1 Stack e architettura
- ✅ **Next.js 16** (App Router, Turbopack) con SSR/SSG configurato
- ✅ **React 19.2.4** con hook `useUser()` per auth management
- ✅ **TypeScript** rigoroso in tutto il codebase
- ✅ **Tailwind CSS 4** con dark theme coerente (#0E0E12 bg, #F4F4F6 text)
- ✅ **Supabase Auth** (email+password, magic link in progress)
- ✅ **Supabase Database** (PostgreSQL) per profili, log, concerti, RSVP, liste
- ✅ **Leaflet + react-leaflet** per mappa dark con marker personalizzati

### 1.2 Cosa fa (core features)
| Feature | Stato | Note |
|---------|-------|------|
| Ricerca artisti | ✅ Funzionante | Via MusicBrainz API |
| Mappa concerti vicini | ✅ Funzionante | Setlist.fm + Ticketmaster + DB locale |
| Log concerto (voto + review) | ✅ Funzionante | Con upload foto |
| RSVP (parteciperò) | ✅ Funzionante | Solo concerti futuri |
| Scaletta (setlist) | ✅ Funzionante | Via Setlist.fm |
| Feed social | ✅ Parziale | Solo review, mancano notifiche real-time |
| Profili pubblici | ✅ Funzionante | /u/[username] con stats |
| Liste personali | ✅ Funzionante | Pubbliche/private |
| Share card (OG image) | ⚠️ Incompleto | Route esiste, non testata |
| Notifiche | ⚠️ Beta | Count endpoint esiste, non UI |
| Wrapped (año stats) | ❌ Vuoto | Route esiste, non collegata |

### 1.3 Dati gestiti
- **Concerti**: ID Ticketmaster/Setlist.fm/UUID, artista, venue, data, lat/lng
- **Utenti**: Supabase Auth + profilo (username, display_name, avatar, bio, city)
- **Log**: user → concert (uno-a-uno), voto (1-5), review, foto
- **RSVP**: user → concert (many-to-many), solo concerti futuri
- **Follow**: user → user social graph
- **Liste**: user → concerti personalizzate

---

## 2. PROBLEMI FUNZIONALI (bug, flussi rotti, feature incomplete)

### P0 🔴 URGENTE

#### 2.1 Auth walls incompleti — `/me`, `/feed`, `/lists`, `/nearby` senza auth
**Problema**: Pagine richiedono autenticazione, ma il feedback non è sempre coerente:
- `/me` → mostra il testo "Accedi per vedere i tuoi concerti" con link (✅ OK)
- `/feed` → mostra testo "Ancora nessuna recensione" anche se non loggato (❌ confuso)
- `/lists` → mostra testo "Non hai ancora liste" anche se non loggato (❌ confuso)
- `/nearby` → carica tutto, mostra mappa vuota se non loggato (⚠️ brutte esperienze)

**File**: [app/feed/page.tsx](app/feed/page.tsx), [app/lists/page.tsx](app/lists/page.tsx), [app/nearby/page.tsx](app/nearby/page.tsx)  
**Impatto**: UX confusa, utente non capisce se deve fare login o se davvero non ha dati  
**Fix consigliato**: 
```tsx
if (loading) return <LoadingState />
if (!user) return <AuthWall message="Accedi per scoprire i tuoi concerti" />
// render data
```

#### 2.2 Flusso signup → welcome → primo concerto non testato end-to-end
**Problema**: 
- Signup crea profilo ✅
- Redirect a `/welcome` con search artisti ✅
- Click artista → `/artist/[mbid]` con `LogConcert` form ✅
- Ma: `/artist/[mbid]` non reindirizza a `/me` dopo il log, l'utente rimane lì confuso

**File**: [app/welcome/page.tsx](app/welcome/page.tsx), [app/artist/[mbid]/artist-client.tsx](app/artist/[mbid]/artist-client.tsx)  
**Impatto**: Nuovo utente non capisce se ha completato l'onboarding  
**Fix consigliato**: Dopo il primo log, reindirizza a `/me` con toast "Benvenuto! Il tuo primo concerto è stato registrato"

#### 2.3 Errori API senza fallback user-facing
**Problema**: Se Ticketmaster/Setlist.fm/fanart.tv sono down:
- `/nearby` mostra lista vuota senza messaggio (❌ confuso se è down o non ci sono concerti)
- `/search` mostra "Nessun artista trovato" (❌ potrebbe essere il server)
- Foto artisti: se fanart.tv fallisce, mostra gradient generico (✅ OK, ma non detto che è fallback)

**File**: [app/page.tsx](app/page.tsx), [app/search/page.tsx](app/search/page.tsx), [app/nearby/page.tsx](app/nearby/page.tsx)  
**Impatto**: Utente non sa se l'app è rotta o i dati non esistono  
**Fix consigliato**: 
```tsx
{hasError && <ErrorBanner message="Ticketmaster non risponde, riproviamo fra poco" />}
```

#### 2.4 Share card button (`/api/card/[logId]`) non testato e senza feedback
**Problema**: 
- Route GET esiste [app/api/card/[logId]/route.tsx](app/api/card/[logId]/route.tsx) ma genera immagine
- Componente [components/share-card-button.tsx](components/share-card-button.tsx) fetcha e scarica/condivide
- Ma: nessun feedback se la generazione fallisce, nessun toast di successo

**File**: [components/share-card-button.tsx](components/share-card-button.tsx), [app/api/card/[logId]/route.tsx](app/api/card/[logId]/route.tsx)  
**Impatto**: Utente non sa se la card è stata generata/condivisa  
**Fix consigliato**: Toast "Card condivisa!" o "Errore nella generazione"

#### 2.5 Mappa non carica se Nominatim (geocoding) fallisce
**Problema**: [app/nearby/page.tsx](app/nearby/page.tsx) usa `useGeolocation()` che chiama Nominatim per reverse geocoding. Se fallisce, la pagina rimane bloccata in loading.

**Impatto**: Utente vede spinner infinito  
**Fix consigliato**: Timeout su geolocation, mostra mappa comunque con fallback a Roma

#### 2.6 Setlist.fm API chiave potrebbe essere mancante o scaduta
**Problema**: [app/api/nearby-concerts/route.ts](app/api/nearby-concerts/route.ts) e [app/api/setlist/route.ts](app/api/setlist/route.ts) dipendono da `SETLISTFM_API_KEY`. Se assente, ritornano array vuoto senza errore.

**Impatto**: Mappa mostra solo Ticketmaster events, feature setlist non funziona  
**Fix consigliato**: Log errore in server, mostra warning user-facing

---

### P1 🟡 ALTO

#### 2.7 Mobile: bottom nav bar copre bottoni
**Problema**: Layout ha `pb-20 sm:pb-0` per main ([app/layout.tsx](app/layout.tsx)), ma:
- Pagine con contenuto mobile potrebbero non avere abbastanza padding
- `LogConcert` form su mobile: bottone "Salva" potrebbe stare sotto la nav

**File**: [app/layout.tsx](app/layout.tsx), [components/ui/log-concert.tsx](components/ui/log-concert.tsx)  
**Impatto**: Bottoni impossibili da cliccare su mobile  
**Fix consigliato**: Verificare `pb-20` su tutte le pagine, aggiungere se manca

#### 2.8 NavBar mobile non mostra feed/lists/profile
**Problema**: Bottom nav (mobile) ha solo 3 icone:
```tsx
const mobileLinks = [
	{ href: "/", label: "Home", Icon: Home },
	{ href: "/nearby", label: "Vicino", Icon: MapPin },
	{ href: "/search", label: "Cerca", Icon: Search },
]
```
Manca `/feed`, `/lists`, `/me`, `/notifications`. Su mobile, l'utente non sa come accedere a questi.

**File**: [components/ui/nav-bar.tsx](components/ui/nav-bar.tsx)  
**Impatto**: Utenti mobile non riescono a navigare  
**Fix consigliato**: 
- Aggiungere menu hamburger con link nascosti
- Oppure: swipe o tab navigation
- Oppure: ridurre a 5 icone (Home, Nearby, Search, Feed/Lists, Me)

#### 2.9 RSVP count non aggiorna real-time
**Problema**: `RsvpButton` fetcha count iniziale, toggl RSVP, aggiorna lo state locale. Ma se due utenti votano contemporaneamente, vedono count stantio.

**File**: [components/rsvp-button.tsx](components/rsvp-button.tsx)  
**Impatto**: Basso, ma statistiche non accurate  
**Fix consigliato**: Aggiungere subscription Supabase realtime

#### 2.10 Concerto con data NULL non è gestito
**Problema**: [app/concert/[id]/concert-client.tsx](app/concert/[id]/concert-client.tsx) mostra "data sconosciuta" per concerti senza data. L'RSVP check `const isFuture = concert.date ? new Date(concert.date) > new Date() : false` fallerà.

**Impatto**: RSVP non funziona per concerti storico-archiviali  
**Fix consigliato**: Permettere RSVP anche per concerti passati (o nascondere il bottone)

---

### P2 🟠 MEDIO

#### 2.11 Loading states troppo semplici
**Problema**: Molte pagine mostrano il testo "Carico…" invece di skeleton animati:
- [app/me/page.tsx](app/me/page.tsx): `if (loading) return <main className="p-6">Carico…</main>`
- [app/lists/page.tsx](app/lists/page.tsx): `{loadingLists ? <p className="text-white/50">Carico…</p> : ...}`
- [app/onboarding/page.tsx](app/onboarding/page.tsx): `if (loading) return <main className="p-6">Carico…</main>`
- [app/welcome/page.tsx](app/welcome/page.tsx): `if (userLoading) return <main className="p-6">Carico…</main>`

**File**: Vari  
**Impatto**: UX poco professionale, utente non sa se è loading o broken  
**Fix consigliato**: Usare `PosterGridSkeleton` o custom skeleton component

#### 2.12 Empty states non invitano all'azione
**Problema**: 
- `/feed`: "Ancora nessuna recensione." (non invita a cercare concerti)
- `/lists`: "Non hai ancora liste. Creane una qui sopra." (OK, ma non invita a scoprire altri)
- `/nearby/past`: Se non ci sono concerti passati, non mostra nulla (dovrebbe invitare a loggarne)

**File**: [app/feed/page.tsx](app/feed/page.tsx), [app/lists/page.tsx](app/lists/page.tsx), [app/nearby/page.tsx](app/nearby/page.tsx)  
**Impatto**: Basso engagement  
**Fix consigliato**: 
```tsx
<div className="border-l-2 border-white/5 py-6 pl-5 text-center text-white/40">
  <p className="mb-2">Ancora nessun concerto.</p>
  <Link href="/search" className="text-[#FF2D6B] hover:underline">
    Scopri i concerti
  </Link>
</div>
```

#### 2.13 Foto upload non testato su upload multiplo
**Problema**: [components/photo-upload.tsx](components/photo-upload.tsx) permette caricare foto, ma non so se fallisce su file grandi o formato sbagliato.

**Impatto**: Potenziale file corrupt o loss of user data  
**Fix consigliato**: Validare file size, format, aggiungere error handling

#### 2.14 Notifiche count aggiornato ogni 30s, potrebbe essere in ritardo
**Problema**: [components/ui/nav-bar.tsx](components/ui/nav-bar.tsx) ha interval di 30s:
```tsx
const interval = setInterval(check, 30000)
```

**Impatto**: Notifiche non real-time  
**Fix consigliato**: Ridurre a 10s o usare Supabase realtime subscription

#### 2.15 Username validation insufficiente
**Problema**: [app/onboarding/page.tsx](app/onboarding/page.tsx) e [app/signup/page.tsx](app/signup/page.tsx) permettono username con soli numeri (es. "123"). Potrebbe causare confusione.

**Fix consigliato**: Richiedere almeno una lettera

---

## 3. PROBLEMI STRUTTURALI (architettura, duplicazione, performance)

### P0 URGENTE

#### 3.1 Duplicazione di codice nei fetch di concerti
**Problema**: Tre file diversi hanno quasi identico codice per fetchare concerti:
- [app/page.tsx](app/page.tsx): fetcha concerti futuri + trending artists
- [app/nearby/page.tsx](app/nearby/page.tsx): fetcha concerti da 3 API (Ticketmaster, Setlist.fm, DB)
- [app/artist/[mbid]/artist-client.tsx](app/artist/[mbid]/artist-client.tsx): fetcha concerti per artista

**Impatto**: Maintenance difficile, bug fix deve essere fatto 3 volte  
**Fix consigliato**: Creare utility `lib/concerts.ts` con funzioni condivise:
```ts
export async function fetchNearby(lat: number, lng: number, radius: number) { ... }
export async function fetchConcertsByArtist(mbid: string) { ... }
export async function fetchTrendingArtists() { ... }
```

#### 3.2 Performance: homepage fa 3 fetch in parallelo senza error handling
**Problema**: [app/page.tsx](app/page.tsx) linea ~70:
```tsx
const [loadTrending, loadUpcoming, loadPersonal] = await Promise.all([...])
```
Se uno fallisce, gli altri si bloccano. Inoltre, no timeout.

**Impatto**: Pagina potrebbe bloccarsi se Ticketmaster è lenta  
**Fix consigliato**: Usare `Promise.allSettled()` invece di `Promise.all()`

#### 3.3 ArtistImage componente fa fetch ogni volta che viene renderizzato
**Problema**: [components/artsit-image.tsx](components/artsit-image.tsx) usa `useEffect` senza dipendenze rettificate:
```tsx
useEffect(() => {
	fetch("/api/artist-image?..." + params)
		.then((r) => r.json())
		.then((d) => setSrc(d.image ?? null))
}, [name, mbid])
```
Se il componente re-render con stessi props, fa il fetch di nuovo. No caching.

**Impatto**: Rate limit su fanart.tv  
**Fix consigliato**: Aggiungere cache `Map<string, Promise<string>>` o usare SWR

#### 3.4 Mappa Leaflet ricreata ogni volta
**Problema**: [app/nearby/page.tsx](app/nearby/page.tsx) usa `dynamic()` per importare mappa, ma non ha `ssr: false` **opzioni di memoria** per evitare ricreazione su re-render.

**Impatto**: Performance scadente su mobile, mappa sfarfalla  
**Fix consigliato**: Wrappare con `useMemo`

#### 3.5 Query Supabase non ottimizzate
**Problema**: [app/nearby/page.tsx](app/nearby/page.tsx) linea ~130:
```tsx
const { data: allLogs } = await supabase.from("logs").select("...", { ... }).not("profiles", "is", null)
```
Fetcha TUTTI i log (senza limit), crea domanda su profiles. Con 10k utenti = OOM.

**Impatto**: Crash se crescono i dati  
**Fix consigliato**: Aggiungere `.limit(100)`, paginare

---

### P1 ALTO

#### 3.6 API routes mancano input validation
**Problema**: [app/api/search-artists/route.ts](app/api/search-artists/route.ts):
```tsx
const q = searchParams.get("q")?.trim()
if (!q) return NextResponse.json({ artists: [] })
```
Non valida lunghezza, charset, injection. MusicBrainz potrebbe ricevere query weirdly formatted.

**Fix consigliato**: `zod` schema validation

#### 3.7 Supabase RLS policies non visibili
**Problema**: Non posso verificare se le RLS policies sono configurate. Se non lo sono, chiunque può leggere/modificare dati di altri utenti.

**Impatto**: SECURITY HOLE  
**Fix consigliato**: 
1. Documentare RLS policies
2. Aggiungere autenticazione su tutte le API route

#### 3.8 Dipendenza su libreria shadcn/ui mancante in some pages
**Problema**: [app/onboarding/page.tsx](app/onboarding/page.tsx) usa componenti shadcn custom rounded-2xl, pero non sono nel pattern brand. Risultato: stili incoerenti.

**Fix consigliato**: Usare componenti standardizzati o creare componenti custom

#### 3.9 Imports relativi lunghi
**Problema**: `../../components/` in alcuni file. Difficile da navigare.

**Fix consigliato**: Usare alias `@/components/` (è già configurato!)

---

### P2 MEDIO

#### 3.10 Geolocation hook non gestisce denied permission
**Problema**: [lib/use-geolocation.ts](lib/use-geolocation.ts) non ha error handling se l'utente nega la geolocalizzazione.

**Fix consigliato**: Mostrare fallback UI o chiedere again

#### 3.11 Linguaggio del sito hardcodato (italiano) senza i18n
**Problema**: Se volete espandere in altri paesi, dovete cercare e sostituire tutte le stringhe.

**Fix consigliato**: Usare `next-i18next` o simile (low priority per MVP)

---

## 4. PROBLEMI GRAFICI/UX (incoerenze visive, stati vuoti, loading, mobile)

### P0 URGENTE

#### 4.1 Styling incoerente: border-radius misto
**Problema**: Il brand richiede **card a bordo sinistro (border-l-2)**, niente `rounded-2xl`. Ma vedo:
- ✅ [app/feed/page.tsx](app/feed/page.tsx): `border-l-2 border-white/10 bg-white/[0.02]`
- ✅ [app/search/page.tsx](app/search/page.tsx): `border-l-2 border-white/10`
- ❌ [app/onboarding/page.tsx](app/onboarding/page.tsx): `rounded-2xl border border-white/10`
- ❌ [app/signup/page.tsx](app/signup/page.tsx): Niente border-l-2, solo rounded inputs
- ❌ [app/lists/page.tsx](app/lists/page.tsx): `rounded-2xl border` sul form
- ✅ [app/lists/page.tsx](app/lists/page.tsx) (lists): `border-l-2` ok

**File**: Vari form pages  
**Impatto**: Brand incoerente, profilo poco professionale  
**Fix consigliato**: Convertire tutti i `rounded-2xl/rounded-lg` a border-l-2 style:

```tsx
// Prima
<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

// Dopo
<div className="border-l-2 border-white/10 bg-white/[0.02] py-4 pl-5">
```

#### 4.2 Header di sezione incoerente
**Problema**: "SEZIONE" label con linea dovrebbe essere coerente. Vedo:
- ✅ [app/search/page.tsx](app/search/page.tsx): `<div className="h-px w-6 bg-white/10" /> <span className="text-xs font-semibold uppercase ...">Cerca</span>`
- ✅ [app/concert/[id]/concert-client.tsx](app/concert/[id]/concert-client.tsx): `Chi c'era ({uniqueAttendees.length})`
- ❌ [app/lists/page.tsx](app/lists/page.tsx): `<h1 className="text-2xl font-bold">Le tue liste</h1>` (niente linea)
- ❌ [app/onboarding/page.tsx](app/onboarding/page.tsx): Niente header di sezione

**Fix consigliato**: Creare componente `SectionHeader` riutilizzabile:
```tsx
export function SectionHeader({ label }: { label: string }) {
	return (
		<div className="flex items-center gap-3 mb-4">
			<div className="h-px w-6 bg-white/10" />
			<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
				{label}
			</span>
		</div>
	)
}
```

#### 4.3 Bottoni inconsistenti
**Problema**: Bottoni primaryaria usano colori diversi:
- ✅ [app/login/page.tsx](app/login/page.tsx): `bg-[#FF2D6B] px-5 py-2 ... text-white transition hover:brightness-110`
- ❌ [app/lists/page.tsx](app/lists/page.tsx): `bg-[#FF2D6B]` (no hover effect)
- ❌ [app/onboarding/page.tsx](app/onboarding/page.tsx): `rounded-lg` (not brand)

**Fix consigliato**: Creare componente `Button` coerente

#### 4.4 Icone emoji o mancanti
**Problema**: Alcune pagine potrebbero usare emoji come fallback icone. Es. [app/search/page.tsx](app/search/page.tsx) linea `if (q) ... <button>✕</button>` (emoji X). Dovrebbe essere icona lucide-react.

**Fix consigliato**: Sempre usare lucide-react

#### 4.5 Mobile: Pagina home non ha title visibile su mobile
**Problema**: [app/page.tsx](app/page.tsx) mostra "Bentornato, [Name]" su desktop, ma su mobile il testo è piccolo e potrebbe essere coperto da notch.

**Fix consigliato**: Media query per ridurre font-size su mobile

#### 4.6 Textarea non ottimizzato per mobile
**Problema**: [components/ui/log-concert.tsx](components/ui/log-concert.tsx) textarea:
```tsx
<textarea rows={3} className="... text-sm ..." />
```
Su mobile, 3 righe potrebbero riempire lo schermo.

**Fix consigliato**: Usare `rows={2}` per mobile tramite media query

---

### P1 ALTO

#### 4.7 Open Graph images mancano su pagine pubbliche
**Problema**: [app/concert/[id]/page.tsx](app/concert/[id]/page.tsx) e [app/artist/[mbid]/page.tsx](app/artist/[mbid]/page.tsx) hanno metadati ma NO `og:image`. Quando condividono su social, non c'è preview.

**File**: [app/concert/[id]/page.tsx](app/concert/[id]/page.tsx), [app/artist/[mbid]/page.tsx](app/artist/[mbid]/page.tsx)  
**Impatto**: Engagement ridotto su social  
**Fix consigliato**: 
```tsx
export async function generateMetadata(...): Promise<Metadata> {
	return {
		openGraph: { 
			images: [{ url: `/api/og/concert/[id]?id=${id}` }]
		}
	}
}
```

#### 4.8 Toast notifications inesistenti
**Problema**: Nessun toast component. Feedback utente è tramite testo inline, non sempre visibile.
- "Salvato! Ora puoi aggiungere le foto qui sotto." [app/api/card/[logId]/route.tsx](app/api/card/[logId]/route.tsx) - inline text
- "Parteciperò" counter non ha feedback di successo

**Fix consigliato**: Aggiungere `sonner` o `react-hot-toast` per toast

#### 4.9 Loading state della mappa bloccante
**Problema**: [app/nearby/page.tsx](app/nearby/page.tsx) mostra `<Loader2 className="animate-spin" />` mentre la mappa carica. Ma se è lenta (5s+), l'utente non sa se è stuck.

**Fix consigliato**: Aggiungere timeout, mostrare "La mappa sta impiegando più del solito..."

#### 4.10 Skeleton non branding-consistent
**Problema**: [components/skeleton.tsx](components/skeleton.tsx):
```tsx
export function Skeleton({ className = "" }: { className?: string }) {
	return <div className={"animate-pulse rounded-md bg-white/10 " + className} />
}
```
Usa `rounded-md`, dovrebbe usare border-l-2 style.

**Fix consigliato**: 
```tsx
<div className="animate-pulse border-l-2 border-white/5 bg-white/[0.02]" />
```

#### 4.11 Input placeholder color incoherente
**Problema**: Placeholder color varia:
- `placeholder:text-white/30` in [app/page.tsx](app/page.tsx)
- `placeholder:text-white/30` in [app/welcome/page.tsx](app/welcome/page.tsx)
- `placeholder:text-white/30` in [app/lists/page.tsx](app/lists/page.tsx)

**Fix consigliato**: Standardizzare a `placeholder:text-white/30`

#### 4.12 Icona "no-image" non chiara per artisti senza foto
**Problema**: Se fanart.tv fallisce, [components/artsit-image.tsx](components/artsit-image.tsx) mostra gradient con lettera iniziale. Non è intuitivo che sia fallback.

**Fix consigliato**: Aggiungere icona lucide-react `Music` sovrapposta o tooltip

---

### P2 MEDIO

#### 4.13 Share button stato loading poco chiaro
**Problema**: [components/share-card-button.tsx](components/share-card-button.tsx) disabilita il bottone durante generazione card, ma non mostra loading indicator chiaro.

**Fix consigliato**: Aggiungere spinner o "`Generando…`" label

#### 4.14 Datepicker mobile non ottimizzato
**Problema**: Input `type="date"` non è stato testato su mobile. Potrebbe avere browser-specific UI.

**Fix consigliato**: Testare su iOS/Android

#### 4.15 Link colore non sempre distinguibile
**Problema**: Link interno usa `text-white hover:underline`, ma colore non è visibile se non hover. Dovrebbe essere magenta (#FF2D6B).

**Fix consigliato**: `text-[#FF2D6B] hover:brightness-110`

---

## 5. PROBLEMI PERFORMANCE E SEO

### P1 ALTO

#### 5.1 SEO: Title generico su pagine dinamiche
**Problema**: 
- [app/concert/[id]/page.tsx](app/concert/[id]/page.tsx): Title è generato correttamente ✅
- [app/artist/[mbid]/page.tsx](app/artist/[mbid]/page.tsx): Title è generato correttamente ✅
- Ma: sitemap non aggiorna automaticamente

**Fix consigliato**: Implementare dynamic sitemap in [app/sitemap.ts](app/sitemap.ts)

#### 5.2 SEO: Description mancano su alcune pagine
**Problema**: 
- Homepage [app/page.tsx](app/page.tsx): ✅ metadata esplicito
- [app/search/page.tsx](app/search/page.tsx): ❌ manca metadata
- [app/feed/page.tsx](app/feed/page.tsx): ❌ manca metadata

**Fix consigliato**: Aggiungere export metadata a tutte le pagine pubbliche

#### 5.3 SEO: Structured data (JSON-LD) incompleto
**Problema**: [app/concert/[id]/page.tsx](app/concert/[id]/page.tsx) genera JSON-LD corretto. Ma:
- [app/artist/[mbid]/page.tsx](app/artist/[mbid]/page.tsx) genera schema MusicGroup semplice (OK)
- Feed items ([app/feed/page.tsx](app/feed/page.tsx)) non hanno schema

**Fix consigliato**: Aggiungere CreativeWork schema per review

#### 5.4 Immagini non ottimizzate con Next.js Image
**Problema**: Tutte le immagini usano `<img>`, non `<Image>` da next/image. Quindi:
- No automatic optimization
- No lazy loading by default (ArtistImage carica il fetch via API, non pre-caricato)

**File**: [components/artsit-image.tsx](components/artsit-image.tsx), [components/concert-photos.tsx](components/concert-photos.tsx), [components/profile-header.tsx](components/profile-header.tsx)  
**Fix consigliato**: Convertire a `<Image from="next/image">`

#### 5.5 Lighthouse: No cache headers su API
**Problema**: [app/api/artist-image/route.ts](app/api/artist-image/route.ts) ha:
```tsx
const res = await fetch(..., { next: { revalidate: 60 * 60 * 24 } })
```
But response doesn't set Cache-Control header verso client.

**Fix consigliato**: 
```tsx
const response = NextResponse.json({ image: best })
response.headers.set("Cache-Control", "public, max-age=86400")
return response
```

#### 5.6 Bundle size: No code splitting
**Problema**: Leaflet è grande (~100KB gzipped). Viene importato sempre, anche su pagine che non lo usano.

**File**: [app/nearby/page.tsx](app/nearby/page.tsx)  
**Fix consigliato**: Già usa `dynamic()`, buono ✅

#### 5.7 CLS (Cumulative Layout Shift) su feed
**Problema**: Feed items caricano immagini artisti dinamicamente via API. Questo causa layout shift quando la foto arriva.

**Fix consigliato**: Reservare spazio per immagine con aspect-ratio

#### 5.8 LCP (Largest Contentful Paint) lento su homepage
**Problema**: Homepage carica concerti via API, non SSG. Potrebbe essere lento.

**Fix consigliato**: Implementare ISR (revalidate every 300s)

---

### P2 MEDIO

#### 5.9 Google Analytics non presente
**Problema**: Nessun GA tracking. Impossibile misurare engagement, funnels, etc.

**Fix consigliato**: Aggiungere `next-google-analytics`

#### 5.10 Error boundary mancante
**Problema**: Se un componente crasha, tutta l'app si blocca.

**Fix consigliato**: Implementare `error.tsx` in app router

#### 5.11 Prefetch Link non configurato
**Problema**: Link non prefetchano per impostazione predefinita. Navigazione è più lenta.

**Fix consigliato**: `<Link prefetch={true}>` su link importanti

---

## 6. PRIORITÀ DI INTERVENTO

### 🔴 P0 — ENTRO 1 SETTIMANA (blocca MVP)

1. **Auth walls coerenti** — tutte le pagine richiedenti login devono mostrare UX uguale
2. **Flusso onboarding end-to-end** — signup → welcome → primo concerto deve funzionare
3. **Mobile nav completa** — aggiungere feed/lists/profile a mobile
4. **Styling coerente** — convertire rounded-2xl a border-l-2 su form, SectionHeader component
5. **API error handling** — fallback user-facing se Ticketmaster/Setlist.fm down
6. **Loading states skeleton** — non più solo testo "Carico…"
7. **Share card feedback** — toast di successo/errore

### 🟡 P1 — ENTRO 2 SETTIMANE (importante per quality)

1. **Mappa geolocation fallback** — timeout se Nominatim lento
2. **Foto upload validation** — file size, format
3. **Bottom nav padding** — verificare pb-20 su tutte le pagine
4. **Button consistency** — creare Button component
5. **Empty states CTA** — aggiungere link a azioni principali
6. **Open Graph images** — concert + artist pages
7. **Structured data** — JSON-LD completo
8. **Query optimization** — limitare fetch, aggiungere pagination
9. **RLS policies documentation** — verificare sicurezza

### 🟠 P2 — ENTRO 1 MESE (nice-to-have)

1. **Toast notifications** — sonner/react-hot-toast
2. **Image optimization** — Next.js Image component
3. **Cache headers** — API response caching
4. **Realtime RSVP** — Supabase subscription
5. **Wrapped feature** — implementare stats year
6. **Notifiche push** — PWA notifications
7. **Lighthouse optimize** — LCP, CLS
8. **Google Analytics** — tracking setup
9. **Error boundaries** — global error.tsx
10. **i18n setup** — per espansione internazionale

### P3 — BACKLOG (dopo MVP)

1. Magic link auth
2. Social login (Google, Spotify)
3. Export concerti CSV
4. Calendar view
5. Integration Spotify
6. Dark/Light mode toggle
7. Accessibility (WCAG 2.1)

---

## 7. CHECKLIST QUICK-WIN (30 min fixes)

- [ ] Convertire tutti i testi "Carico…" a skeleton
- [ ] Aggiungere auth wall coerente su `/feed`, `/lists`
- [ ] Creare `SectionHeader` component, usare ovunque
- [ ] Standardizzare placeholder color a `placeholder:text-white/30`
- [ ] Aggiungere `.limit(100)` alle query Supabase che mancano di limite
- [ ] Convertire `Promise.all()` a `Promise.allSettled()` in homepage
- [ ] Aggiungere `Cache-Control` header su API routes
- [ ] Verificare `pb-20` su pagine mobile
- [ ] Aggiungere `aria-label` a bottoni iconici
- [ ] Documentare RLS policies in README

---

## 8. RACCOMANDAZIONI STRATEGICHE

### 8.1 Priorità MVP
Prima del launch in produzione (beta):
1. ✅ Flusso signup completo e testato
2. ✅ Ricerca artisti (MusicBrainz)
3. ✅ Log concerto (voto + review)
4. ✅ Mappa concerti
5. ✅ Profili pubblici
6. ❌ Social features (feed, follow) — posticipare a v0.2
7. ❌ Notifiche — posticipare
8. ❌ Wrapped — posticipare

### 8.2 Tech debt da affrontare prima di scaling
- Implement RLS policies completamente
- Code review sul Supabase schema
- Load testing su API (Ticketmaster potrebbe rifiutare troppe richieste)
- Backup strategy (Supabase automated)

### 8.3 Roadmap post-MVP
- v0.2: Social (follow, comments, notifications)
- v0.3: Wrapped + stats
- v0.4: Mobile app (React Native)
- v0.5: Integration Spotify
- v1.0: Full feature parity con versione web

---

## 9. CONCLUSION

**Stato**: MVP funzionante al 75%  
**Ready for beta**: NO (mancano auth walls, styling coerente, error handling)  
**Ready for production**: NO (mancano security review, load testing, monitoring)  
**Estimated fix time**: P0+P1 = 2-3 settimane (con 1 dev full-time)

**Raccomandazione**: Fix tutti i P0 entro questa settimana, poi passare a P1 durante la prossima sprint. Dopo ciò, aprire beta limitato.

