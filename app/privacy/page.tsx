export default function PrivacyPage() {
	return (
		<main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
			<div className="mb-8 flex items-center gap-3">
				<div className="h-px w-6 bg-white/10" />
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Legale</span>
			</div>
			<h1 className="mb-8 text-3xl font-bold [font-family:var(--font-display)]">Privacy Policy</h1>
			<p className="mb-6 text-sm text-white/50">Ultimo aggiornamento: Giugno 2026</p>

			<div className="flex flex-col gap-6 text-sm leading-relaxed text-white/70">
				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">1. Titolare del trattamento</h2>
					<p>Encore è un servizio offerto da Massimiliano Demiri, contattabile all&apos;indirizzo email: m.demiri@hotmail.it.</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">2. Dati raccolti</h2>
					<p>Raccogliamo i seguenti dati personali:</p>
					<ul className="mt-1 list-disc pl-5 space-y-1">
						<li><strong>Email</strong> — necessaria per creare e accedere all&apos;account</li>
						<li><strong>Username e nome visualizzato</strong> — identificano il tuo profilo pubblico</li>
						<li><strong>Città</strong> — opzionale, per mostrare i concerti nella tua zona</li>
						<li><strong>Avatar</strong> — opzionale, immagine del profilo</li>
						<li><strong>Recensioni e voti</strong> — contenuti che scegli di pubblicare sui concerti</li>
						<li><strong>Foto dei concerti</strong> — contenuti che scegli di caricare</li>
					</ul>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">3. Finalità del trattamento</h2>
					<p>I dati sono trattati per:</p>
					<ul className="mt-1 list-disc pl-5 space-y-1">
						<li>Fornire il servizio di diario dei concerti</li>
						<li>Mostrare il tuo profilo pubblico ad altri utenti</li>
						<li>Inviare notifiche relative all&apos;attività sul tuo profilo</li>
						<li>Inviare email di servizio (es. reset password, link di accesso)</li>
					</ul>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">4. Base giuridica</h2>
					<p>Il trattamento si basa sul consenso esplicito (Art. 6.1.a GDPR) al momento della registrazione e sull&apos;esecuzione del contratto di servizio (Art. 6.1.b GDPR).</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">5. Conservazione</h2>
					<p>I dati sono conservati fino alla cancellazione dell&apos;account. Puoi richiedere la cancellazione in qualsiasi momento scrivendo a m.demiri@hotmail.it.</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">6. Servizi di terze parti</h2>
					<p>Utilizziamo i seguenti fornitori di servizi:</p>
					<ul className="mt-1 list-disc pl-5 space-y-1">
						<li><strong>Supabase</strong> — hosting del database e autenticazione (USA, certificato EU-US Data Privacy Framework)</li>
						<li><strong>Vercel</strong> — hosting dell&apos;applicazione (USA)</li>
						<li><strong>Setlist.fm, MusicBrainz, Ticketmaster</strong> — dati pubblici su concerti e artisti</li>
					</ul>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">7. Diritti dell&apos;utente</h2>
					<p>Hai diritto ad accedere, rettificare, cancellare i tuoi dati, limitare il trattamento, opporti al trattamento e alla portabilità dei dati. Per esercitare questi diritti, scrivi a m.demiri@hotmail.it.</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">8. Cookie</h2>
					<p>Encore utilizza solo cookie tecnici strettamente necessari per l&apos;autenticazione (cookie di sessione di Supabase). Non utilizziamo cookie di profilazione o tracciamento.</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-white">9. Contatti</h2>
					<p>Per qualsiasi domanda sulla privacy: m.demiri@hotmail.it</p>
				</section>
			</div>
		</main>
	)
}