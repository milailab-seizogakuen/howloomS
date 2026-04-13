import { NextRequest, NextResponse } from 'next/server'
import { verifyJwt, COOKIE_NAME } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/signup', '/api/auth/login', '/api/auth/logout', '/api/auth/register', '/api/auth/google', '/auth/callback', '/demo']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 静的アセット・public パスはスルー
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
        return NextResponse.next()
    }

    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    const payload = await verifyJwt(token)
    if (!payload) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
