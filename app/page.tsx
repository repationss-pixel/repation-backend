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

function MapMock() {
  return (
    <svg
      viewBox="0 0 580 440"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-label="Carte des restaurants Repation"
    >
      <defs>
        <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.22" />
        </filter>
        <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#000000" floodOpacity="0.12" />
        </filter>
      </defs>

      <rect width="580" height="440" fill="#F0ECE4" />
      <path d="M0 402 Q90 390 180 397 Q270 404 360 392 Q450 380 580 388 L580 440 L0 440 Z" fill="#B8D4E8" />

      <rect x="214" y="92" width="106" height="98" fill="#D4E8D4" />
      <circle cx="240" cy="120" r="10" fill="#B8D8BC" />
      <circle cx="272" cy="136" r="13" fill="#B8D8BC" />
      <circle cx="302" cy="114" r="9" fill="#B8D8BC" />
      <circle cx="290" cy="162" r="11" fill="#B8D8BC" />
      <circle cx="252" cy="168" r="8" fill="#B8D8BC" />

      <rect x="0" y="0" width="90" height="80" fill="#E0DAD0" rx="1" />
      <rect x="100" y="0" width="100" height="80" fill="#DDD7CC" rx="1" />
      <rect x="214" y="0" width="106" height="80" fill="#E0DAD0" rx="1" />
      <rect x="330" y="0" width="110" height="80" fill="#DDD7CC" rx="1" />
      <rect x="452" y="0" width="128" height="80" fill="#E0DAD0" rx="1" />

      <rect x="0" y="92" width="90" height="98" fill="#DDD7CC" rx="1" />
      <rect x="100" y="92" width="100" height="98" fill="#E0DAD0" rx="1" />
      <rect x="330" y="92" width="110" height="98" fill="#DDD7CC" rx="1" />
      <rect x="452" y="92" width="128" height="98" fill="#E0DAD0" rx="1" />

      <rect x="0" y="204" width="90" height="86" fill="#E0DAD0" rx="1" />
      <rect x="100" y="204" width="100" height="86" fill="#DDD7CC" rx="1" />
      <rect x="214" y="204" width="106" height="86" fill="#E0DAD0" rx="1" />
      <rect x="330" y="204" width="110" height="86" fill="#DDD7CC" rx="1" />
      <rect x="452" y="204" width="128" height="86" fill="#E0DAD0" rx="1" />

      <rect x="0" y="300" width="90" height="70" fill="#DDD7CC" rx="1" />
      <rect x="100" y="300" width="100" height="70" fill="#E0DAD0" rx="1" />
      <rect x="214" y="300" width="106" height="70" fill="#DDD7CC" rx="1" />
      <rect x="330" y="300" width="110" height="70" fill="#E0DAD0" rx="1" />
      <rect x="452" y="300" width="128" height="70" fill="#DDD7CC" rx="1" />

      <rect x="0" y="382" width="90" height="20" fill="#DDD7CC" rx="1" />
      <rect x="100" y="382" width="100" height="20" fill="#E0DAD0" rx="1" />
      <rect x="214" y="382" width="106" height="20" fill="#DDD7CC" rx="1" />
      <rect x="330" y="382" width="110" height="20" fill="#E0DAD0" rx="1" />
      <rect x="452" y="382" width="128" height="20" fill="#DDD7CC" rx="1" />

      <rect x="0" y="80" width="580" height="12" fill="white" />
      <rect x="0" y="190" width="580" height="14" fill="white" />
      <rect x="0" y="290" width="580" height="10" fill="white" />
      <rect x="0" y="370" width="580" height="12" fill="white" />

      <rect x="90" y="0" width="10" height="402" fill="white" />
      <rect x="200" y="0" width="14" height="402" fill="white" />
      <rect x="320" y="0" width="10" height="402" fill="white" />
      <rect x="440" y="0" width="12" height="402" fill="white" />

      <line x1="0" y1="197" x2="580" y2="197" stroke="#D8D0C4" strokeWidth="1" strokeDasharray="12,8" />
      <line x1="207" y1="0" x2="207" y2="402" stroke="#D8D0C4" strokeWidth="1" strokeDasharray="12,8" />

      <g transform="translate(546, 16)">
        <rect width="28" height="56" rx="6" fill="white" filter="url(#card-shadow)" />
        <text x="14" y="20" textAnchor="middle" fill="#444" fontSize="16" fontWeight="300">+</text>
        <line x1="6" y1="28" x2="22" y2="28" stroke="#CCC" strokeWidth="1" />
        <text x="14" y="46" textAnchor="middle" fill="#444" fontSize="16" fontWeight="300">−</text>
      </g>

      <text x="10" y="418" fontFamily="system-ui, sans-serif" fontSize="9" fill="#7AAABB">© Repation Maps</text>

      <circle cx="145" cy="135" r="20" fill="#1D9E75" opacity="0">
        <animate attributeName="r" values="22;40;22" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.25;0;0.25" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="145" cy="135" r="22" fill="#1D9E75" filter="url(#pin-shadow)" />
      <circle cx="145" cy="135" r="10" fill="white" />

      <rect x="158" y="106" width="150" height="46" rx="10" fill="white" filter="url(#card-shadow)" />
      <rect x="158" y="106" width="4" height="46" rx="2" fill="#1D9E75" />
      <text x="172" y="124" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="11" fill="#1A1A1A">Le Bistrot Parisien</text>
      <text x="172" y="141" fontFamily="system-ui, sans-serif" fontSize="10" fill="#666666">Français · 2 places dispo</text>

      <circle cx="375" cy="240" r="18" fill="#1D9E75" filter="url(#pin-shadow)" />
      <circle cx="375" cy="240" r="8" fill="white" />

      <circle cx="145" cy="325" r="16" fill="#1D9E75" filter="url(#pin-shadow)" />
      <circle cx="145" cy="325" r="7" fill="white" />

      <circle cx="490" cy="135" r="16" fill="#1D9E75" filter="url(#pin-shadow)" />
      <circle cx="490" cy="135" r="7" fill="white" />

      <circle cx="45" cy="245" r="14" fill="#1D9E75" filter="url(#pin-shadow)" />
      <circle cx="45" cy="245" r="6" fill="white" />
    </svg>
  );
}

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
              <a
                href={accountHref}
                className="text-sm font-semibold bg-[#1D9E75] text-white px-5 py-2.5 rounded-xl hover:bg-[#178560] transition-colors shadow-sm"
              >
                Mon compte
              </a>
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
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 min-h-[88vh] items-center">

            {/* Left */}
            <div className="py-16 lg:py-0 lg:pr-8">
              <p className="text-[#1D9E75] font-black text-3xl tracking-tight mb-8">Repation</p>
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.08] mb-6 tracking-tight">
                <span className="text-gray-900">Le hasard</span>
                <br />
                <span className="text-[#1D9E75]">vous met à table.</span>
              </h1>

              <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-lg">
                Repation vous connecte à d&apos;autres convives dans des restaurants partenaires près de chez vous.
              </p>

              <SearchPanel />
            </div>

            {/* Right — Map */}
            <div className="hidden lg:flex items-center justify-center py-12">
              <div className="relative w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                <MapMock />
              </div>
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
