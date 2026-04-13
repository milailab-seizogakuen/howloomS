import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt, COOKIE_NAME } from '@/lib/auth'
import { getVideoProgressByUserId, upsertVideoProgress } from '@/lib/sheets'

async function getSession() {
    const store = await cookies()
    const token = store.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifyJwt(token)
}

export async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const progress = await getVideoProgressByUserId(session.userId)
    return NextResponse.json({ progress })
}

export async function POST(request: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { videoId, isCompleted } = await request.json()
    await upsertVideoProgress(session.userId, videoId, isCompleted)
    return NextResponse.json({ ok: true })
}
