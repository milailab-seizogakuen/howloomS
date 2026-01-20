import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { calculateProgress } from '@/lib/utils'

// Sparkle decoration component - Removed

async function getCourseData(userId: string) {
    const supabase = await createClient()

    const { data: courses } = await supabase
        .from('courses')
        .select(`*, videos (*)`)
        .order('sort_order')

    if (!courses) return []

    const { data: videoProgress } = await supabase
        .from('video_progress')
        .select('video_id, is_completed')
        .eq('user_id', userId)

    const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id, course_id')

    const { data: quizResults } = await supabase
        .from('quiz_results')
        .select('quiz_id, passed')
        .eq('user_id', userId)

    return courses.map(course => {
        const courseVideos = (course.videos || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
        const courseQuizzes = quizzes?.filter(q => q.course_id === course.id) || []

        const completedVideos = courseVideos.filter((video: { id: string }) =>
            videoProgress?.some(vp => vp.video_id === video.id && vp.is_completed)
        ).length

        const passedQuizzes = courseQuizzes.filter(quiz =>
            quizResults?.some(qr => qr.quiz_id === quiz.id && qr.passed)
        ).length

        const progress = calculateProgress(
            completedVideos,
            courseVideos.length,
            passedQuizzes,
            courseQuizzes.length
        )

        return {
            ...course,
            videos: courseVideos,
            videoCount: courseVideos.length,
            completedVideoCount: completedVideos,
            quizCount: courseQuizzes.length,
            passedQuizCount: passedQuizzes,
            progress,
        }
    })
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (!profile) {
        redirect('/onboarding')
    }

    // Check if user is approved
    if (!profile.is_approved) {
        redirect('/approval-pending')
    }

    const courses = await getCourseData(user.id)

    // Sorting and grouping logic
    // 1. Sort by date desc (Public date)
    const sortedByDate = [...courses].sort((a, b) => {
        const dateA = new Date(a.date || a.created_at).getTime()
        const dateB = new Date(b.date || b.created_at).getTime()
        return dateB - dateA
    })
    const recentCourse = sortedByDate[0]

    // 2. Filter remaining courses
    const remainingCourses = courses.filter(c => c.id !== recentCourse?.id)

    // 3. Split into In-Progress and Others
    const inProgressCourses = remainingCourses.filter(c => c.progress > 0 && c.progress < 100)

    // 4. Others: Not Started or Completed. Sort by date desc
    const otherCourses = remainingCourses.filter(c => c.progress === 0 || c.progress === 100)
        .sort((a, b) => {
            const dateA = new Date(a.date || a.created_at).getTime()
            const dateB = new Date(b.date || b.created_at).getTime()
            return dateB - dateA
        })

    // Helper to get status label and color
    const getStatusInfo = (progress: number) => {
        if (progress === 100) return { label: '完了', color: 'bg-[#4A7C6F] text-white', button: '復習する' }
        if (progress > 0) return { label: '受講中', color: 'bg-[#8B7BB8] text-white', button: '続きから見る' }
        return { label: '未受講', color: 'bg-[#E8E0D0] text-[#8B7355]', button: '受講する' }
    }

    // Helper for date formatting
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-howl-header text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <img
                                src="/logo-member.png"
                                alt="HOWL"
                                className="h-10 w-auto"
                            />
                        </Link>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-6">
                            <Link href="/dashboard" className="flex items-center gap-1 text-amber-200 border-b-2 border-amber-400 pb-1">
                                <span>ホーム</span>
                            </Link>
                            <Link href="/chat" className="flex items-center gap-1 opacity-80 hover:opacity-100">
                                <span>チャット</span>
                            </Link>
                        </nav>
                    </div>

                    {/* User */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm hidden sm:block">
                            <span className="text-amber-200">{profile.name}</span>
                            <span className="text-white/60 text-xs ml-2">さん</span>
                        </span>
                        <Link href="/profile" className="relative">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.name}
                                    className="w-10 h-10 rounded-full border-2 border-amber-400"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-medium border-2 border-amber-400">
                                    {profile.name.charAt(0)}
                                </div>
                            )}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
                {/* Guidance Text */}
                <div className="text-center">
                    <p className="text-lg text-[#2D4A4A] font-medium animate-pulse">
                        最近更新された授業から受講できます
                    </p>
                </div>

                {/* 1. Recent Class Section */}
                {recentCourse && (
                    <section>
                        <h2 className="text-2xl font-bold text-[#2D4A4A] mb-4 flex items-center gap-2">
                            最近の授業
                        </h2>
                        <div
                            className="bg-white rounded-3xl p-6 shadow-xl border-2 border-[#C9A227] overflow-hidden relative group"
                        >
                            <div className="flex flex-col lg:flex-row gap-8 items-center">
                                {/* Thumbnail */}
                                <div className="w-full lg:w-1/2 aspect-video rounded-xl overflow-hidden shadow-md relative">
                                    {recentCourse.videos && recentCourse.videos[0]?.video_id ? (
                                        <div
                                            className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                            style={{
                                                backgroundImage: `url(https://img.youtube.com/vi/${recentCourse.videos[0].video_id}/hqdefault.jpg)`
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#2D4A4A] to-[#1E3535]" />
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-sm rounded-lg border border-white/20">
                                            {formatDate(recentCourse.date || recentCourse.created_at)} 公開
                                        </span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 w-full text-center lg:text-left">
                                    <h3 className="text-3xl font-bold text-[#2D2D2D] mb-4">
                                        {recentCourse.title}
                                    </h3>
                                    <p className="text-[#6B6B6B] mb-8 line-clamp-2 text-lg">
                                        {recentCourse.description || "講座の内容をご確認ください。"}
                                    </p>

                                    <Link
                                        href={`/courses/${recentCourse.id}`}
                                        className="inline-block w-full lg:w-auto px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 shadow-lg"
                                        style={{
                                            background: 'linear-gradient(135deg, #4A7C6F 0%, #2D4A4A 100%)'
                                        }}
                                    >
                                        続きから見る →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 2. In Progress Courses */}
                {inProgressCourses.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold text-[#2D4A4A] mb-4 flex items-center gap-2">
                            受講中の講座
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {inProgressCourses.map(course => {
                                const status = getStatusInfo(course.progress)
                                const thumbnail = course.videos && course.videos[0]?.video_id
                                    ? `https://img.youtube.com/vi/${course.videos[0].video_id}/hqdefault.jpg`
                                    : null

                                return (
                                    <Link
                                        key={course.id}
                                        href={`/courses/${course.id}`}
                                        className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
                                        style={{ border: '1px solid #E8E0D0' }}
                                    >
                                        {/* Thumbnail */}
                                        <div className="h-40 relative bg-cover bg-center"
                                            style={{
                                                backgroundImage: thumbnail
                                                    ? `url(${thumbnail})`
                                                    : 'linear-gradient(135deg, #8B7BB8 0%, #6B5A9E 100%)'
                                            }}
                                        >
                                            {thumbnail && <div className="absolute inset-0 bg-black/20" />}
                                            <div className="absolute bottom-3 left-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h3 className="font-bold text-[#2D2D2D] mb-3 line-clamp-2 min-h-[3rem]">
                                                {course.title}
                                            </h3>
                                            <button
                                                className="w-full py-2 rounded-lg font-medium text-sm transition-all"
                                                style={{
                                                    background: '#FAF7F0',
                                                    color: '#8B7355',
                                                    border: '1px solid #E8E0D0'
                                                }}
                                            >
                                                {status.button}
                                            </button>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* 3. Other Courses */}
                <section>
                    <h2 className="text-xl font-semibold text-[#2D4A4A] mb-4 flex items-center gap-2">
                        その他の講座
                    </h2>
                    {otherCourses.length === 0 ? (
                        <div className="text-center py-8 text-[#8B7355] bg-[#FAF7F0] rounded-xl border border-[#E8E0D0]">
                            その他の講座はありません
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {otherCourses.map(course => {
                                const status = getStatusInfo(course.progress)
                                const thumbnail = course.videos && course.videos[0]?.video_id
                                    ? `https://img.youtube.com/vi/${course.videos[0].video_id}/hqdefault.jpg`
                                    : null

                                return (
                                    <Link
                                        key={course.id}
                                        href={`/courses/${course.id}`}
                                        className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 block opacity-90 hover:opacity-100"
                                        style={{ border: '1px solid #E8E0D0' }}
                                    >
                                        {/* Thumbnail */}
                                        <div className="h-40 relative bg-cover bg-center grayscale group-hover:grayscale-0 transition-all"
                                            style={{
                                                backgroundImage: thumbnail
                                                    ? `url(${thumbnail})`
                                                    : 'linear-gradient(135deg, #E8E0D0 0%, #D4C8B8 100%)'
                                            }}
                                        >
                                            {thumbnail && <div className="absolute inset-0 bg-white/20" />}
                                            <div className="absolute bottom-3 left-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h3 className="font-bold text-[#2D2D2D] mb-3 line-clamp-2 min-h-[3rem]">
                                                {course.title}
                                            </h3>
                                            <button
                                                className="w-full py-2 rounded-lg font-medium text-sm transition-all"
                                                style={{
                                                    background: status.label === '完了' ? '#E8E0D0' : '#4A7C6F',
                                                    color: status.label === '完了' ? '#8B7355' : 'white',
                                                }}
                                            >
                                                {status.button}
                                            </button>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
