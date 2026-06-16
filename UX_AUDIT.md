# UX AUDIT — Encore (mobile-first)

**Ambito**: UI/UX design system e mobile-first review dell’esperienza nell’app Encore (Next.js 16 + Tailwind + Supabase), focus su **tracking concerti dal vivo**, **Italia**, **tema scuro**.

**Data**: 16 giugno 2026

**Fonti nel codebase** (principali):
- Timeline artista: `app/artist/[mbid]/artist-client.tsx`
- Feed: `app/feed/page.tsx`
- Ricerca: `app/search/page.tsx`
- Navbar mobile: `components/ui/nav-bar.tsx`
- Pagina concerto: `app/concert/[id]/concert-client.tsx` (e wrapper `app/concert/[id]/page.tsx`)
- Watchlist RSVP: `app/me/rsvps/page.tsx`
- Log concerto: `components/ui/log-concert.tsx`
- Scaletta: `components/setlist.tsx`
- Map: `components/concert-map.tsx`
- Zona: `app/nearby/page.tsx` e home `app/page.tsx`

---

## 1) Liste lunghe / scroll infinito

### 1.1 Pagina artista: timeline per anno (timeline utile, ma rischio “muro” su mobile)
**Dove**: `ArtistClient`

**Com’è oggi**
- Raggruppa i **passati per anno**.
- Per ogni anno mostra **max 3 concerti** + se molti: `<details>` con “+ altri …”.
- C’è una **sticky horizontal year bar** (scroll orizzontale).
- In parallelo c’è una logica di **load more** per concerti extra.
- Per i “passati” tenta fetch scalette per un sottoinsieme limitato (prime 3 per anno, max 9).

**Problema mobile-first**
- Anche con i dettagli per anno, l’utente può percepire comunque una sequenza lunga: anni molti → molte intestazioni → ripetizione visiva.
- La sticky year bar aiuta la navigazione, ma su mobile:
  - 1) è **una navigazione secondaria** che richiede attenzione,
  - 2) non offre filtri per “decadi”/“range”, quindi l’utente scorre comunque “per trovare”.

**Impatto percepito**
- “Non finisce mai” (fatica, abbandono).
- Difficoltà a scoprire rapidamente “i concerti che contano” (es. migliori recensioni/foto, concerti più recenti, ecc.).

**Proposta alternative (senza cambiare la sostanza, ma migliorando IA e controllo)**
1) **Accordion per blocchi di anni + collapse intelligente**
   - Parti con “Anno più recente” e “Anno corrente” aperti; gli altri collassati.
   - “Apri tutto” solo su richiesta.

2) **Filtro per decade (progressive disclosure)**
   - Sopra la lista: toggle “Decadi / Anni”.
   - In “Decadi” mostri gruppi (es. 2010–2019) con conteggio; aprendo, discendi agli anni.
   - Su mobile riduce drasticamente il numero di intestazioni viste.

3) **Paginazione / “Carica altri” contestuale per la timeline passata**
   - Oggi “Carica altri concerti” riguarda la lista generale.
   - Su mobile, rendi “Carica altri” **legato a un range temporale**:
     - “Mostra anche 2018–2016” oppure “Mostra 20 concerti in più (più vecchi)”.

4) **Priorità contenuto (ordinamento per utilità, non solo data)**
   - Offri modalità: “Più recenti”, “Più votati”, “Con scaletta/foto”.
   - Anche solo una select piccola riduce l’attrito.

**Microcopy suggerita**
- Invece di “+ altri …” (giusto) aggiungi “Apri per vedere tutti i concerti di {anno}”.
- Per “Carica altri” usa “Carica altri {n} concerti” se il backend lo permette.

**Trade-off**
- Più controlli = più UI. Soluzione: filtri compressi in un **bottom sheet** o in un’**accordion bar**.

---

### 1.2 Feed: cards verticali (30 recensioni = lungo su mobile)
**Dove**: `app/feed/page.tsx`

**Com’è oggi**
- Fetch con `.limit(30)`.
- Lista verticale con card per review, con line-clamp.
- Nessuna paginazione/infinite scroll.
- Tab: “Tutti” e “Seguiti”.

**Problema mobile-first**
- 30 card su mobile è spesso oltre la soglia di “scansione veloce”.
- La card è informativa, ma la review in line-clamp può generare “scroll senza arrivo”.

**Impatto percepito**
- Se l’utente è “in scoperta”, scorre a lungo prima di aggiornare contenuto.
- Se è “intenzionale” (vuole qualcosa specifico), non ha controllo (nessun filtro aggiuntivo).

**Proposte**
1) **Mostra di più (paginazione semplice)**
   - Bottone: “Mostra altri” sotto la lista.
   - Usa `offset/limit` o cursor (logged_at, id).

2) **Infinite scroll con guardrail**
   - Infinite scroll sì, ma con:
     - progress indicator (“Carico altre recensioni…”) non testo.
     - “stop”: non caricare all’infinito senza possibilità di filtrare.

3) **Filtro lightweight**
   - Un solo filtro “In evidenza” (es. più recenti / più utili / con rating alto).

4) **Rendere il feed più “scansionabile”**
   - Suggerimento design system: header fisso della card (nome artista + città/data + rating) e review più compressa.

---

### 1.3 Ricerca: griglia 2–3 colonne (funziona o è dispersiva?)
**Dove**: `app/search/page.tsx`

**Com’è oggi**
- Se `q` è vuoto: mostra “I più cercati” in **grid** (2 col su mobile, 3+ su sm).
- Se c’è `q`: mostra **lista verticale**.

**Valutazione UX mobile-first**
- Questa scelta è corretta come architettura informativa: 
  - scoperta (tendenza) → grid
  - ricerca mirata → lista
- Probabile punto debole: la grid mostra anche info secondaria (“12 concerti”) che può diventare “rumore visivo”.

**Migliorie possibili**
1) **Ridurre densità in grid**
   - Mostrare “info” solo su tap/expand, oppure sostituirla con un badge leggero.

2) **Sincronizzare micro-interazioni**
   - Quando l’utente digita, la UI passa da grid a lista: assicurarsi che lo spazio e le skeletons mantengano stabilità (evitare jump percettibili).

3) **Gestione risultati zero più informativa**
   - Oggi: “Nessun artista trovato per …”.
   - Proposta: suggerire “Cerca con MBID” o “Prova un altro nome” + link verso tendenza.

---

## 2) Navigazione e architettura dell’informazione

### 2.1 Navbar mobile: 4 icone ma mancano Feed e Liste
**Dove**: `components/ui/nav-bar.tsx`

**Com’è oggi**
- Mobile bar fissa: **Home, Vicino, Cerca**.
- Profilo/Accedi in aggiunta (conta come ulteriore slot).
- `Feed` e `Liste` non sono presenti.

**Problema**
- Feed e Liste sono feature social/curation: assenza in mobile = scoperta difficile.
- Utenti mobile-first potrebbero considerare “Feed e Liste non esistono”.

**Soluzioni senza perdere semplicità**
1) **Bottom nav a 5 voci (consigliato)**
   - Home, Feed, Cerca, Vicino, Profilo.
   - Liste accessibili da dentro Profilo (sezione “Liste”).

2) **Profili come hub + deep links**
   - Mantieni 4 slot, ma rendi Profilo un hub con un **quick access menu**:
     - “Feed”
     - “Liste”
     - “Notifiche”
     - “Impostazioni”
   - In ottica design system: stesso pattern bottom-sheet per tutte le sezioni.

3) **Badge per notifiche**
   - Hai già badge sul Profilo: ottimo. Estendilo solo se aggiungi Feed.

**Trade-off**
- 5 icone richiede spacing e tipografia calibrata su 10px: va ottimizzato ma è fattibile.

---

### 2.2 Pagina concerto: molte sezioni (ordine ok ma densità alta)
**Dove**: `concert-client.tsx`

**Com’è oggi**
- Sezioni: header con media voto, RSVP/Log, AddToList, Scaletta, Foto, Recensioni + azioni (likes/comments/share).
- “Chi c’era” e “Parteciperanno” mostrati come chip/stack avatar.
- Per futuri: recensioni/partecipanti presenti con logica, RSVP show.

**Problema mobile-first**
- Anche se l’ordine è logico, l’utente può trovarsi a dover scrollare tanto prima di:
  - scaletta
  - contenuti “action” (RSVP / log)
  - recensioni
- Alcune sezioni dipendono da dati (es. recensioni vuote): meglio trasformarle in **progressive disclosure**.

**Proposte di collassamento**
1) **Accordion per sezioni secondarie**
   - “Chi c’era”, “Scaletta”, “Foto”, “Recensioni” come accordion con default:
     - Header (media + RSVP/log) sempre aperta
     - Il resto collassato con indicator “n”

2) **Ancoraggi rapidi (jump links)**
   - Una row di 3–4 pill top: “Scaletta”, “Foto”, “Recensioni”, “Chi c’era”.
   - Su mobile riduce lo scroll “cieco”.

3) **Sezione RSVP/Log più in alto**
   - Già c’è una logica `isFuture` e `LogConcert` è subito sotto. Mantenerla sticky potrebbe aiutare, ma valutare rischio conflitto con bottom nav.

---

### 2.3 Watchlist (`/me/rsvps`): lista semplice sufficiente?
**Dove**: `app/me/rsvps/page.tsx`

**Valutazione**
- Buona: lista futuri, card semplice, CTA implicita (“usa Parteciperò”).

**Migliorie micro**
- Aggiungere un filtro “Per mese” o “In arrivo”/“Più lontani” se la watchlist cresce.
- Empty state: già presente, ma potrebbe aggiungere CTA button:
  - “Vai ai concerti vicini”
  - “Cerca un artista”

---

## 3) Componenti che possono essere migliorati

### 3.1 LogConcert: form voto + recensione + upload foto
**Dove**: `components/ui/log-concert.tsx`

**Com’è oggi**
- Se concerto futuro: messaggio informativo (no form).
- Se passato: form con select voto (1–5 con ★), textarea review, bottone salva, bottone elimina se esiste logId.
- Quando logId esiste: mostra `PhotoUpload`.

**Problema mobile-first**
- La sequenza “select → textarea → upload” può essere lunga.
- Il select è ok, ma la UX “con scala” (1–5) può essere più immediata se resa tap-friendly.

**Proposte**
1) **Rating come “radial/toggle” (star tappabili)**
   - Pattern design system: 5 stelle come component cliccabile (toccabile su mobile).
   - Mantieni select solo come fallback/compat.

2) **Progressive disclosure per review**
   - Su mobile mostra textarea con collapse “Racconta di più (facoltativo)”.

3) **Upload foto: feedback esplicito**
   - Bottone upload con microcopy: “Aggiungi foto (max X)”.
   - Stato caricamento non solo disabilitazione.

4) **Elimina con undo**
   - `confirm()` è brutale. Proposta: bottom-sheet “Confermi? Annulla”.

---

### 3.2 Setlist: fino a 30 canzoni (lunga su mobile)
**Dove**: `components/setlist.tsx`

**Com’è oggi**
- `<ol>` verticale, numerazione + “BIS” quando `encore=true`.
- Ogni riga ha link YouTube con icona (ExternalLink) sempre presente.

**Problema mobile-first**
- 30 righe = tanto contenuto soprattutto con canzoni lunghe.
- L’azione YouTube è “presente” ma l’occhio deve cercarla (opacità 0 finché hover: su mobile non sempre c’è hover).

**Impatto**
- “Azioni invisibili” o difficili su touch.

**Proposte**
1) **Collapse per bis e segmenti**
   - Mostra prima “Main set” (es. prime 12) + CTA “Mostra completo”.
   - Opzione separata per “Encore”.

2) **Rendere l’icona sempre visibile su touch**
   - In CSS: usare `group-hover:...` ma anche `focus-visible` e `active`.
   - Oppure icona a sinistra fissa (riduce ricerca).

3) **Ricerca nella scaletta (quick filter)**
   - Input “cerca canzone” locale sopra la lista (anche solo client-side).

---

### 3.3 ConcertMap: marker e popup leggibili?
**Dove**: `components/concert-map.tsx`

**Com’è oggi**
- Marker con icona custom (immagine artista in cerchio) size 42.
- Popup con min-w 160, testo con nome + venue/città + data + prezzo + link.

**Problemi mobile-first**
- Popup può diventare troppo lungo in lunghezza testo (venue + city + date + prezzo + 2 link).
- Il marker grande aiuta la tap area, ma la leggibilità dipende dal zoom del map.
- Leaflet su mobile: scroll/pan possono interferire con tap.

**Proposte**
1) **Popup “compatto” + link “Dettagli”**
   - Ridurre righe (es. mostra solo nome + data; prezzo e biglietti in seconda azione).

2) **Modal bottom-sheet per dettagli**
   - Pattern ottimo su mobile: tap marker → bottom-sheet con informazioni leggibili e pulsanti.

3) **Ridurre la larghezza minima e aumentare contrasto**
   - `min-w-[160px]` ok, ma verificare wrapping; imporre line clamp sulle righe secondarie.

---

## 4) Casi limite e stati particolari

### 4.1 Concerto futuro senza recensioni/scaletta/foto: pagina vuota o “invita all’azione”?
**Dove**: `concert-client.tsx` (logica future/pass

**Com’è oggi**
- `RsvpButton` appare in alto se `isFuture`.
- Se non ci sono recensioni e partecipanti ancora, le sezioni diventano:
  - banner rating: “Ancora nessun voto”
  - blocco “Recensioni (0)”: mostra sempre il placeholder “Nessuna recensione ancora. Sii il primo!”
  - “Scaletta”: comunque renderizza `Setlist` (che per date future spesso risulta vuoto).

**Problema mobile-first**
- La pagina futura è ricca di sezioni, ma alcune possono essere vuote/placeholder → la user percepisce “poca sostanza” ma deve comunque scorrere.

**Proposta UX**
1) **Regola di default: se futuro + dati assenti, comprimi le sezioni non rilevanti**
   - “Scaletta” → mostra skeleton/CTA tipo: “Scaletta non disponibile finché non è stato pubblicato il set. Aggiungi dopo il live.”
   - “Foto” → CTA “Carica foto dopo il concerto”.

2) **Sezione primaria: RSVP + cosa succede dopo**
   - Sotto il bottone RSVP: 2 righe di microcopy:
     - “Dopo il live potrai votare e lasciare una recensione.”
     - “Anche la scaletta arriverà quando disponibile.”

3) **Progressive disclosure su mobile**
   - Le sezioni “secondarie” (foto/recensioni dettagliate) default collapsed con conteggio e “Apri”.

---

### 4.2 Artista inesistente / MusicBrainz down
**Dove**: `app/search/page.tsx` e `app/api/search-artists/route.ts` (backend) e pagine artista.

**Com’è oggi (frontend)**
- Search: se non trova risultati → messaggio “Nessun artista trovato per …”.
- Non distingue tra:
  - “query valida, artista non esiste”
  - “servizio MB non risponde”

**Problema UX**
- Utente non ha indicazione di affidabilità dati o comportamento consigliato.

**Proposte microcopy e pattern**
1) **Gestione error vs empty**
   - Backend dovrebbe distinguere errori (es. 502/503) da empty results.
   - Frontend: se error → “Servizio di ricerca momentaneamente non disponibile. Riprova tra poco.” + link “Torna a tendenza”.

2) **Retry + backoff**
   - Quando MusicBrainz down, retry automatico 1 volta con delay (es. 1.5s) solo se utente è ancora sulla pagina e non ha avviato una nuova ricerca.

3) **Supporto input**
   - Placeholder “Prova con nome senza soprannomi” o “Prova anche con uno degli artisti in tendenza”.

---

### 4.3 Stato “nessun concerto nella tua zona” su /nearby e home
**Dove**: `app/nearby/page.tsx` e home `app/page.tsx`.

**Com’è oggi (nearby)**
- Se API falliscono o nessuno match in radius: possibile UI con mappa senza marker e/o liste vuote.
- C’è banner errori se falliscono alcune sorgenti (setlist/tm/db) ma non sempre è immediatamente chiaro all’utente “perché” non ci sono concerti.

**Home**
- Se `upcoming` è vuoto e trending non disponibile, mostra: “Ancora nessun concerto.” e per non loggati un CTA generico.

**Problema mobile-first**
- Empty state può sembrare “app rotta” o “non succede mai nulla”.

**Proposte UX**
1) **Empty state con causa probabile e prossima azione**
   - Se posizione disponibile: “Non abbiamo trovato concerti entro {radiusKm} km.”
   - Azioni:
     - “Aumenta raggio” (quick toggle: 50→80→150)
     - “Cambia città” (CTA verso Profilo)
     - “Mostra tutta Italia”

2) **Quando API down**
   - Usa gli `errors` già presenti, ma trasformali in un messaggio “user-friendly” con priorità (non solo testo).
   - Esempio:
     - “Al momento Ticketmaster / Setlist.fm non risponde. Stiamo riprovando.”

3) **Skeleton vs empty**
   - Distinguere chiaramente tra loading e risultato “0”.

---

## 5) Sommario opportunità (Design System & UX Patterns)

### 5.1 Progressive disclosure come standard
- Timeline artista: accordion/decade.
- Pagina concerto: accordion per sezioni secondarie.
- Mappa: bottom-sheet per dettagli.

### 5.2 Empty state con CTA
- Feed: CTA verso “Scopri concerti”
- Nearby: CTA per raggio/città/Italia
- Search: CTA verso “I più cercati” quando è down o empty

### 5.3 Azioni touch-first
- LogConcert: rating con componenti tap
- Setlist: icona link sempre accessibile o bottom-sheet per azioni

---

## 6) Priorità UX (P0/P1/P2)

### P0 — entro 1 settimana (mobile-first, conversione)
1. **Controllo delle liste lunghe**
   - timeline artista: accordion/decade + “mostra range”
   - feed: paginazione “mostra di più”

2. **Empty state con CTA esplicita**
   - /nearby “0 risultati entro raggio” + aumenti raggio
   - /feed “nessuna recensione” → CTA ricerca

3. **Bottom nav accessibile**
   - risolvere assenza Feed/Liste su mobile con hub/quick menu.

4. **Pag. concerto futura: compressione sezioni vuote**
   - rendere RSVP e cosa succede dopo la prima esperienza.

### P1 — entro 2 settimane (quality)
1. **Ricerca: distingui errore vs empty** (MB down)
2. **ConcertMap: popup leggibili su mobile** (bottom-sheet/modal)
3. **LogConcert e Setlist: action touch-first**
4. **Caricamenti coerenti** (skeleton vs testo “Carico…” per le sezioni più visibili)

### P2 — entro 1 mese (nice-to-have)
1. **Microcopy e component polish** (aria-label, focus-visible, line-clamp controllato)
2. **Onboarding micro-feedback** (“hai completato” e cosa fare dopo)

---

## 7) Raccomandazione finale
Encore è già solida su feature core (RSVP, log, scaletta, mappa). Le principali opportunità UX per mobile-first riguardano **progressive disclosure**, **paginazione/controllo della quantità**, e **empty/error states trasformati in azioni** invece che in messaggi statici.

