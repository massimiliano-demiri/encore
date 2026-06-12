export default function TermsPage() {
	return (
		<main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
			<div className="mb-8 flex items-center gap-3">
				<div className="h-px w-6 bg-white/10" />
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Legale</span>
			</div>
			<h1 className="mb-8 text-3xl font-bold [font-family:var(--font-display)]">Termini di Servizio</h1>
			<p className="mb-6 text-sm text-white/50">Ultimo aggiornamento: Giugno 2026</p>

			<div className="flex flex-col gap-6 text-sm leading-relaxed text-white/70">
				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">1. Descrizione del servizio</h2>
					<p>Encore è una piattaforma che permette di tenere un diario personale dei concerti dal vivo: cercare artisti, loggare concerti, scrivere recensioni, aggiungere foto e scalette, e connettersi con altri appassionati.</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">2. Registrazione</h2>
					<p>Per utilizzare Encore devi creare un account fornendo un indirizzo email valido. Devi avere almeno 14 anni. Sei responsabile della sicurezza della tua password e delle attività che avvengono sul tuo account.</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">3. Contenuti</h2>
					<p>Pubblicando recensioni, foto o altri contenuti su Encore, mantieni la proprietà di tali contenuti ma concedi a Encore una licenza non esclusiva per visualizzarli sulla piattaforma. Non pubblicare contenuti illegali, offensivi, diffamatori o che violino diritti di terzi.</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">4. Codice di condotta</h2>
					<ul className="list-disc pl-5 space-y-1">
						<li>Sii rispettoso verso gli altri utenti</li>
						<li>Non pubblicare spam o contenuti promozionali</li>
						<li>Non impersonare altre persone</li>
						<li>Non utilizzare la piattaforma per attività illegali</li>
					</ul>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">5. Limitazione di responsabilità</h2>
					<p>Encore è fornito &quot;così com&apos;è&quot;. Non garantiamo la disponibilità ininterrotta del servizio. Non siamo responsabili per i contenuti pubblicati dagli utenti né per eventuali danni derivanti dall&apos;uso della piattaforma.</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">6. Cessazione</h2>
					<p>Puoi cancellare il tuo account in qualsiasi momento. Ci riserviamo il diritto di sospendere o terminare account che violino questi termini.</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">7. Modifiche</h2>
					<p>Questi termini possono essere aggiornati. In caso di modifiche sostanziali, gli utenti saranno avvisati via email.</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">8. Legge applicabile</h2>
					<p>Questi termini sono regolati dalla legge italiana. Per qualsiasi controversia, il foro competente è quello di residenza del consumatore.</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">9. Contatti</h2>
					<p>Per qualsiasi domanda: m.demiri@hotmail.it</p>
				</section>
			</div>
		</main>
	)
}