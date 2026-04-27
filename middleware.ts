import { NextRequest, NextResponse } from 'next/server'

const ADMIN_COOKIE = 'repation_admin'
const SESSION_COOKIE = 'repation_session'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Admin routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname.startsWith('/admin/login')) return NextResponse.next()

    const token = req.cookies.get(ADMIN_COOKIE)?.value
    const password = process.env.ADMIN_PASSWORD ?? 'admin'
    if (token === password) return NextResponse.next()

    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // ── Restaurateur dashboard ────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard/restaurateur')) {
    const raw = req.cookies.get(SESSION_COOKIE)?.value
    if (!raw) {
      const url = req.nextUrl.clone()
      url.pathname = '/connexion'
      return NextResponse.redirect(url)
    }
    try {
      const session = JSON.parse(raw) as { type?: string }
      if (session.type !== 'RESTAURATEUR') {
        const url = req.nextUrl.clone()
        url.pathname = '/connexion'
        return NextResponse.redirect(url)
      }
    } catch {
      const url = req.nextUrl.clone()
      url.pathname = '/connexion'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/restaurateur/:path*'],
}
