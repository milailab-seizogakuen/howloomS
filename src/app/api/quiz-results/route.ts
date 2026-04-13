import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt, COOKIE_NAME } from '@/lib/auth'
import { getQuizResultsByUserId, insertQuizResult } from '@/lib/sheets'

async function getSession() {
    const store = await cookies()
    const token = store.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifyJwt(token)
}

export async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const results = await getQuizResultsByUserId(session.userId)
    return NextResponse.json({ results })
}

export async function POST(request: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { quizId, score, passed, answers } = await request.json()
    await insertQuizResult({ user_id: session.userId, quiz_id: quizId, score, passed, answers })
    return NextResponse.json({ ok: true })
}
