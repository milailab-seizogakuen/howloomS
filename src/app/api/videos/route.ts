import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt, COOKIE_NAME } from '@/lib/auth'
import { getVideosWithTags } from '@/lib/sheets'

export async function GET() {
    const store = await cookies()
    const token = store.get(COOKIE_NAME)?.value
    if (!token || !(await verifyJwt(token))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const videos = await getVideosWithTags()
    return NextResponse.json({ videos })
}
