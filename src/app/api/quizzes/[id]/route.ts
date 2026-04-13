import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt, COOKIE_NAME } from '@/lib/auth'
import { getQuizById } from '@/lib/sheets'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const store = await cookies()
    const token = store.get(COOKIE_NAME)?.value
    if (!token || !(await verifyJwt(token))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const quiz = await getQuizById(id)
    if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ quiz })
}
