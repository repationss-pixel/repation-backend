import Link from 'next/link'

export const metadata = { title: "CGU Restaurateurs — Repation" }

export default function CGURestaurateurs() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/dashboard/restaurateur">
            <img src="/logo-repation.png" alt="Repation" style={{ height: '32px', width: 'auto' }} />
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500">CGU Restaurateurs</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Conditions Générales d'Utilisation — Restaurateurs
        </h1>
        <p className="text-sm text-gray-400 mb-8">Dernière mise à jour : avril 2026</p>

        <Section titre="1. Présentation du service">
          Repation est une plateforme de mise en relation entre convives souhaitant partager un repas
          dans des restaurants partenaires. En vous inscrivant en tant que restaurateur, vous acceptez
          sans réserve les présentes conditions générales d'utilisation.
        </Section>

        <Section titre="2. Inscription et compte">
          <ul>
            <li>L'inscription est gratuite pour les restaurateurs.</li>
            <li>Vous devez fournir des informations exactes : nom de l'établissement, email, numéro de téléphone et adresse.</li>
            <li>Un seul compte par établissement est autorisé.</li>
            <li>Vous êtes responsable de la confidentialité de vos identifiants.</li>
            <li>Repation se réserve le droit de suspendre tout compte en cas d'abus.</li>
          </ul>
        </Section>

        <Section titre="3. Réservations — Convives">
          <ul>
            <li>
              Toute réservation d'un convive nécessite l'enregistrement d'une carte bancaire valide.
              Aucun débit n'est effectué pour une présence confirmée.
            </li>
            <li>
              <strong>Annulation gratuite</strong> : jusqu'à 20 minutes avant l'heure du créneau réservé.
            </li>
            <li>
              <strong>Frais d'absence non justifiée</strong> : en cas d'annulation tardive ou d'absence non signalée,
              1€ est prélevé sur la carte du convive — ce montant ne revient pas au restaurateur.
            </li>
            <li>
              La présence est confirmée par le scan du QR code de l'établissement dans les 30 minutes
              suivant l'heure du créneau.
            </li>
          </ul>
        </Section>

        <Section titre="4. Facturation — Restaurateurs">
          <ul>
            <li>
              La facturation Repation n'est activée qu'à partir du <strong>5ème client amené dans le mois</strong>{' '}
              (visite certifiée = double scan QR de deux convives distincts).
            </li>
            <li>
              À partir du 5ème client certifié, Repation facture <strong>1 € par client (HT, TVA 20 % en sus)</strong>.
              Les 4 premiers clients du mois sont toujours gratuits.
            </li>
            <li>
              Le prélèvement est automatique en fin de mois via la carte bancaire enregistrée.
            </li>
          </ul>
        </Section>

        <Section titre="5. Comportement des utilisateurs">
          <ul>
            <li>Toute utilisation frauduleuse du service est interdite.</li>
            <li>Les convives s'engagent à se présenter à leurs réservations ou à annuler dans les délais.</li>
            <li>Les restaurateurs s'engagent à accueillir les convives Repation dans les conditions habituelles.</li>
            <li>Repation n'est pas responsable du comportement des utilisateurs lors des repas.</li>
          </ul>
        </Section>

        <Section titre="6. Propriété intellectuelle">
          L'ensemble des contenus du service Repation (logo, textes, interface) est protégé par le droit
          de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.
        </Section>

        <Section titre="7. Limitation de responsabilité">
          <ul>
            <li>Repation est un intermédiaire technique et ne peut être tenu responsable des incidents
            survenant entre convives ou entre convives et restaurants.</li>
            <li>Repation ne garantit pas la disponibilité permanente du service.</li>
            <li>
              En cas de litige relatif à un prélèvement, contactez-nous via{' '}
              <strong>le formulaire de contact disponible sur repation.fr</strong>.
            </li>
          </ul>
        </Section>

        <Section titre="8. Modification des CGU">
          Repation se réserve le droit de modifier les présentes CGU. Les restaurateurs partenaires
          seront informés par email en cas de modification substantielle. La poursuite de l'utilisation
          du service vaut acceptation des nouvelles conditions.
        </Section>

        <Section titre="9. Droit applicable">
          Les présentes CGU sont soumises au droit français. Tout litige sera soumis aux tribunaux
          compétents du ressort de Paris.
        </Section>

        <div className="mt-12 pt-6 border-t border-gray-100">
          <Link href="/dashboard/restaurateur" className="text-[#8B5E3C] text-sm hover:underline">
            ← Retour au tableau de bord
          </Link>
        </div>
      </main>
    </div>
  )
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-3">{titre}</h2>
      <div className="text-gray-600 leading-relaxed space-y-2 text-sm">{children}</div>
    </section>
  )
}
