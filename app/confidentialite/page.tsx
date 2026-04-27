import Link from 'next/link'

export const metadata = { title: 'Politique de confidentialité — Repation' }

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/">
            <img src="/logo-repation.png" alt="Repation" style={{ height: '32px', width: 'auto' }} />
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500">Politique de confidentialité</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 prose prose-gray prose-sm sm:prose-base">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-gray-400 mb-8">Dernière mise à jour : avril 2026</p>

        <Section titre="1. Qui sommes-nous ?">
          Repation est un service de mise en relation entre convives dans des restaurants partenaires.
          Le responsable du traitement des données est la société Repation, joignable via{' '}
          <strong>le formulaire de contact disponible sur repation.fr</strong>.
        </Section>

        <Section titre="2. Données collectées">
          <p>Nous collectons les données suivantes :</p>
          <ul>
            <li><strong>Convives</strong> : prénom, adresse email, numéro de téléphone, méthode de paiement Stripe (token, jamais le numéro de carte).</li>
            <li><strong>Restaurateurs</strong> : prénom/nom de l'établissement, adresse email, numéro de téléphone, adresse de l'établissement, coordonnées GPS, méthode de paiement Stripe.</li>
            <li><strong>Données de navigation</strong> : aucun cookie de tracking tiers. Seul un cookie de session fonctionnel est utilisé.</li>
            <li><strong>Données de géolocalisation</strong> : collectées ponctuellement lors du scan QR pour valider la présence dans l'établissement. Non conservées au-delà de la validation.</li>
          </ul>
        </Section>

        <Section titre="3. Finalités du traitement">
          <ul>
            <li>Gestion des réservations et mise en relation entre convives.</li>
            <li>Facturation des restaurateurs partenaires.</li>
            <li>Prélèvement des frais de no-show (1€) en cas d'absence non annulée.</li>
            <li>Envoi d'emails transactionnels (confirmation de réservation, rappels).</li>
            <li>Amélioration du service Repation.</li>
          </ul>
        </Section>

        <Section titre="4. Base légale">
          Les traitements sont fondés sur l'exécution d'un contrat (inscription, réservation) et
          sur notre intérêt légitime (lutte contre les no-shows, amélioration du service).
          Le traitement des données de paiement est fondé sur l'exécution du contrat.
        </Section>

        <Section titre="5. Destinataires des données">
          <p>Vos données peuvent être transmises aux prestataires suivants :</p>
          <ul>
            <li><strong>Stripe</strong> — traitement des paiements (conforme PCI-DSS).</li>
            <li><strong>Resend</strong> — envoi des emails transactionnels.</li>
            <li><strong>Supabase / PostgreSQL</strong> — hébergement de la base de données (UE).</li>
            <li><strong>Vercel</strong> — hébergement de l'application (serveurs UE disponibles).</li>
          </ul>
          <p>Nous ne vendons ni ne louons vos données à des tiers.</p>
        </Section>

        <Section titre="6. Durée de conservation">
          <ul>
            <li>Données de compte : conservées 3 ans après la dernière activité.</li>
            <li>Données de réservation : conservées 5 ans à des fins comptables.</li>
            <li>Données de paiement : gérées directement par Stripe selon leurs propres politiques.</li>
          </ul>
        </Section>

        <Section titre="7. Vos droits (RGPD)">
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Accès</strong> : obtenir une copie de vos données.</li>
            <li><strong>Rectification</strong> : corriger des données inexactes.</li>
            <li><strong>Effacement</strong> : demander la suppression de votre compte.</li>
            <li><strong>Portabilité</strong> : recevoir vos données dans un format structuré.</li>
            <li><strong>Opposition</strong> : vous opposer à certains traitements.</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous via{' '}
            <strong>le formulaire de contact disponible sur repation.fr</strong>. <br />
            Vous pouvez également introduire une réclamation auprès de la CNIL (cnil.fr).
          </p>
        </Section>

        <Section titre="8. Cookies">
          Repation utilise un unique cookie de session fonctionnel (<code>repation_session</code>)
          nécessaire au fonctionnement du service. Aucun cookie publicitaire ou analytique tiers n'est déposé.
        </Section>

        <Section titre="9. Sécurité">
          Les données sont transmises via HTTPS. Les mots de passe ne sont pas stockés — l'authentification
          repose sur email + téléphone. Les données de paiement sont tokenisées par Stripe et
          ne transitent jamais par nos serveurs en clair.
        </Section>

        <div className="mt-12 pt-6 border-t border-gray-100">
          <Link href="/" className="text-[#1D9E75] text-sm hover:underline">← Retour à l'accueil</Link>
        </div>
      </main>
    </div>
  )
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-3">{titre}</h2>
      <div className="text-gray-600 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}
