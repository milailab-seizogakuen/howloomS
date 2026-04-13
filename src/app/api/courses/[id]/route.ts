import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt, COOKIE_NAME } from '@/lib/auth'
import { getCourseById, getVideos } from '@/lib/sheets'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const store = await cookies()
    const token = store.get(COOKIE_NAME)?.value
    if (!token || !(await verifyJwt(token))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const [course, videos] = await Promise.all([getCourseById(id), getVideos()])
    if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const courseVideos = videos
        .filter(v => v.course_id === id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

    return NextResponse.json({ course: { ...course, videos: courseVideos } })
}
