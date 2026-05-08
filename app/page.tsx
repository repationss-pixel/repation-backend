import SearchPanel from "@/components/SearchPanel";
import InscriptionForm from "@/components/InscriptionForm";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic'

const steps = [
  {
    title: "1. Je réserve",
    description: "Je choisis un restaurant partenaire et un créneau disponible",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: "2. Je rencontre",
    description: "Repation me met en relation avec un autre convive",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    title: "3. Je partage",
    description: "On se retrouve à table et on partage un bon repas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
        <path d="M5 3l14 18" strokeDasharray="0" opacity="0" />
        <path d="M8 3v3c0 2.2 1.8 4 4 4s4-1.8 4-4V3" />
        <path d="M12 10v11" />
      </svg>
    ),
  },
];



export default function Home() {
  let sessionPrenom: string | null = null;
  let sessionType: string | null = null;
  try {
    const raw = cookies().get("repation_session")?.value;
    if (raw) {
      const parsed = JSON.parse(raw);
      sessionPrenom = parsed.prenom ?? null;
      sessionType = parsed.type ?? null;
    }
  } catch {}

  const accountHref = sessionType === "RESTAURATEUR" ? "/dashboard/restaurateur" : "/mon-compte";
  const accountLabel = sessionPrenom ? `${sessionPrenom}` : null;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo-repation.png" alt="Repation" style={{ height: '44px', width: 'auto', display: 'block' }} />
          </div>
          <nav className="flex items-center gap-3">
            {accountLabel ? (
              <>
                {sessionType === "PARTICULIER" && (
                  <a
                    href="/mon-profil"
                    className="text-sm font-semibold text-[#1D9E75] border border-[#1D9E75] px-5 py-2.5 rounded-xl hover:bg-[#1D9E75]/5 transition-colors"
                  >
                    Mon profil
                  </a>
                )}
                <a
                  href={accountHref}
                  className="text-sm font-semibold bg-[#1D9E75] text-white px-5 py-2.5 rounded-xl hover:bg-[#178560] transition-colors shadow-sm"
                >
                  Mon compte
                </a>
              </>
            ) : (
              <>
                <a
                  href="/inscription"
                  className="text-sm font-semibold text-[#1D9E75] border border-[#1D9E75] px-5 py-2.5 rounded-xl hover:bg-[#1D9E75]/5 transition-colors"
                >
                  Inscription
                </a>
                <a
                  href="/connexion"
                  className="text-sm font-semibold bg-[#1D9E75] text-white px-5 py-2.5 rounded-xl hover:bg-[#178560] transition-colors shadow-sm"
                >
                  Connexion
                </a>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex flex-col items-center text-center min-h-[88vh] justify-center py-16">
            <p className="text-[#1D9E75] font-black text-3xl tracking-tight mb-8">Repation</p>
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.08] mb-6 tracking-tight">
              <span className="text-gray-900">Le hasard</span>
              <br />
              <span className="text-[#1D9E75]">vous met à table.</span>
            </h1>

            <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-xl">
              Repation vous connecte à d&apos;autres convives dans des restaurants partenaires près de chez vous.
            </p>

            <div className="w-full">
              <SearchPanel />
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section id="comment-ca-marche" className="py-24 px-6 bg-[#F8F9FA]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              En 3 étapes simples, transformez un repas solitaire en moment de convivialité.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="w-12 h-12 bg-[#1D9E75]/10 rounded-xl flex items-center justify-center mb-5 text-[#1D9E75]">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inscription ── */}
      <section id="inscription" className="py-24 px-6 bg-white">
        <div className="max-w-lg mx-auto">
          {accountLabel ? (
            <div className="text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                Bon retour,{" "}
                <span className="text-[#1D9E75]">{accountLabel}</span>&nbsp;!
              </h2>
              <p className="text-lg text-gray-500">Retrouvez vos réservations et votre profil.</p>
              <a
                href={accountHref}
                className="inline-block bg-[#1D9E75] hover:bg-[#178560] text-white font-semibold px-8 py-4 rounded-2xl transition-colors text-base shadow-sm"
              >
                Accéder à mon compte →
              </a>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
                  Rejoindre Repation
                </h2>
                <p className="text-lg text-gray-500">
                  Gratuit pour tous. Restaurateurs et convives.
                </p>
              </div>
              <InscriptionForm />
            </>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-200 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-start gap-1">
            <img src="/logo-repation.png" alt="Repation" style={{ height: '32px', width: 'auto', display: 'block' }} />
            <p className="text-sm text-gray-400 italic">
              Le hasard vous met à table.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Repation. Tous droits réservés.
            </p>
            <a href="/contact" className="text-sm text-gray-400 hover:text-gray-600 underline">Contact</a>
            <a href="/cgu" className="text-sm text-gray-400 hover:text-gray-600 underline">CGU</a>
            <a href="/confidentialite" className="text-sm text-gray-400 hover:text-gray-600 underline">Confidentialité</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
