import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt, COOKIE_NAME } from '@/lib/auth'
import { getCourses, getVideos } from '@/lib/sheets'

export async function GET() {
    const store = await cookies()
    const token = store.get(COOKIE_NAME)?.value
    if (!token || !(await verifyJwt(token))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [courses, videos] = await Promise.all([getCourses(), getVideos()])
    const sortedVideos = videos.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const coursesWithVideos = courses.map(c => ({
        ...c,
        videos: sortedVideos.filter(v => v.course_id === c.id),
    }))

    return NextResponse.json({ courses: coursesWithVideos })
}
