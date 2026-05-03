import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/', request.url))
  response.cookies.set('repation_session', '', { maxAge: 0, path: '/' })
  return response
}
