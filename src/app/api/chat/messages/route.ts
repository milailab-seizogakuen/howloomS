import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt, COOKIE_NAME } from '@/lib/auth'
import { getChatsByUserId, insertChat, getProfileByEmail } from '@/lib/sheets'

async function getSession() {
    const store = await cookies()
    const token = store.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifyJwt(token)
}

export async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const messages = await getChatsByUserId(session.userId)
    return NextResponse.json({ messages })
}

export async function POST(request: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message } = await request.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    await insertChat({ user_id: session.userId, message: message.trim(), sender_type: 'user' })
    return NextResponse.json({ ok: true })
}
