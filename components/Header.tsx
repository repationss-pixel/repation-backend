'use client'

import { useEffect, useState } from 'react'

interface Session {
  loggedIn: boolean
  prenom: string | null
  type: string | null
}

export default function Header() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(setSession)
      .catch(() => setSession({ loggedIn: false, prenom: null, type: null }))
  }, [])

  const accountHref = session?.type === 'RESTAURATEUR' ? '/dashboard/restaurateur' : '/mon-compte'

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <a href="/">
            <img src="/logo-repation.png" alt="Repation" style={{ height: '44px', width: 'auto', display: 'block' }} />
          </a>
        </div>
        <nav className="flex items-center gap-3">
          {session === null ? (
            // Chargement silencieux — aucun flash
            <div className="h-10 w-32 rounded-xl bg-gray-100 animate-pulse" />
          ) : session.loggedIn ? (
            <>
              {session.type === 'PARTICULIER' && (
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
                {session.prenom ? session.prenom : 'Mon compte'}
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
  )
}
