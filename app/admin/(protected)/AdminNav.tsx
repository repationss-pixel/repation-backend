'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Tableau de bord', exact: true },
  { href: '/admin/restaurants', label: 'Restaurants', exact: false },
  { href: '/admin/particuliers', label: 'Particuliers', exact: false },
  { href: '/admin/reservations', label: 'Réservations', exact: false },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 flex items-center gap-2 h-14">
        <div className="flex items-center gap-2 mr-6">
          <div className="w-7 h-7 bg-[#1D9E75] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            R
          </div>
          <span className="font-semibold text-gray-800 text-sm">Admin</span>
        </div>

        <nav className="flex items-center gap-0.5 flex-1">
          {LINKS.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#1D9E75]/10 text-[#1D9E75]'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors ml-4"
        >
          Déconnexion
        </button>
      </div>
    </header>
  )
}
