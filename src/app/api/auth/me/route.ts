import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt, COOKIE_NAME } from '@/lib/auth'

export async function GET(request: NextRequest) {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
        return NextResponse.json({ user: null }, { status: 401 })
    }

    const payload = await verifyJwt(token)
    if (!payload) {
        return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({
        user: {
            userId: payload.userId,
            email: payload.email,
            name: payload.name,
            isAdmin: payload.isAdmin,
            isApproved: payload.isApproved,
        }
    })
}
