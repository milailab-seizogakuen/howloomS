import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt, COOKIE_NAME } from '@/lib/auth'
import { getProfileByEmail, updateProfile, insertProfile } from '@/lib/sheets'

async function getSession() {
    const store = await cookies()
    const token = store.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifyJwt(token)
}

export async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ profile: null }, { status: 401 })

    const profile = await getProfileByEmail(session.email)
    if (!profile) return NextResponse.json({ profile: null }, { status: 404 })

    return NextResponse.json({ profile })
}

export async function PUT(request: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    await updateProfile(session.email, data)
    return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    await insertProfile({ ...data, email: session.email, id: crypto.randomUUID() })
    return NextResponse.json({ ok: true })
}
