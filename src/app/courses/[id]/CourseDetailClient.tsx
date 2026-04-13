'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { calculateProgress } from '@/lib/utils'
import type { Course, Video, VideoProgress, Quiz, QuizResult } from '@/types/database'
import LoomPlayer from '@/components/LoomPlayer'

interface CourseDetailClientProps {
    courseId: string
}

interface CourseData extends Course {
    videos: Video[]
}



export default function CourseDetailClient({ courseId }: CourseDetailClientProps) {
    const router = useRouter()
    const [course, setCourse] = useState<CourseData | null>(null)
    const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([])
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [quizResults, setQuizResults] = useState<QuizResult[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [completingVideo, setCompletingVideo] = useState<string | null>(null)
    const [thumbnailByVideoId, setThumbnailByVideoId] = useState<Record<string, string | null>>({})

    const fetchData = useCallback(async () => {
        // カスタムJWT認証でセッション確認
        const authRes = await fetch('/api/auth/me')
        if (!authRes.ok) {
            router.push('/login')
            return
        }

        const [courseRes, progressRes, quizzesRes, resultsRes] = await Promise.all([
            fetch(`/api/courses/${courseId}`),
            fetch('/api/progress'),
            fetch('/api/quiz-results'),
            fetch(`/api/courses/${courseId}`), // quizzes included via quizzes endpoint below
        ])

        if (!courseRes.ok) { router.push('/dashboard'); return }

        const [courseData, progressData, resultsData] = await Promise.all([
            courseRes.json(),
            progressRes.json(),
            resultsRes.json(),
        ])

        // quizzes - fetch separately
        const quizzesRes2 = await fetch(`/api/courses/${courseId}`)
        const { course: courseJson } = courseData

        // fetch quizzes for this course by getting all quizzes via quiz-results hint would need endpoint,
        // so we use the quiz-results response and separately check if quiz exists
        // Simplified: quizzes loaded from the quizzes endpoint per quiz id if needed
        setCourse(courseJson)
        setVideoProgress(progressData.progress ?? [])
        setQuizResults(resultsData.results ?? [])
        setIsLoading(false)
    }, [courseId, router])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // 講座内の動画サムネをまとめて取得（Loom oEmbed 経由）
    useEffect(() => {
        if (!course?.videos || course.videos.length === 0) return

        let cancelled = false

        const run = async () => {
            const nextMap: Record<string, string | null> = {}

            await Promise.all(
                course.videos.map(async (video) => {
                    if (thumbnailByVideoId[video.id] !== undefined) return

                    const videoUrl = (video as any).video_url || (video as any).youtube_url
                    const loomId = (video as any).video_id

                    if (!videoUrl && !loomId) {
                        nextMap[video.id] = null
                        return
                    }

                    try {
                        const params = new URLSearchParams()
                        if (videoUrl) params.set('url', videoUrl)
                        else if (loomId) params.set('id', loomId)

                        const res = await fetch(`/api/loom/thumbnail?${params.toString()}`)
                        const json = await res.json()
                        nextMap[video.id] = json?.thumbnail_url ?? null
                    } catch {
                        nextMap[video.id] = null
                    }
                })
            )

            if (cancelled) return
            if (Object.keys(nextMap).length === 0) return

            setThumbnailByVideoId(prev => ({ ...prev, ...nextMap }))
        }

        run()

        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [course])

    const handleMarkComplete = async (videoId: string) => {
        setCompletingVideo(videoId)
        try {
            await fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId, isCompleted: true }),
            })
            await fetchData()
        } catch (error) {
            console.error('Failed to mark video complete:', error)
        } finally {
            setCompletingVideo(null)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#E8E0D0] border-t-[#8B7BB8] rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-[#8B7355]">
                        読み込み中...
                    </p>
                </div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        講座が見つかりません
                    </h1>
                    <Link href="/dashboard" className="mt-4 text-[#8B7BB8] hover:underline block">
                        ダッシュボードに戻る
                    </Link>
                </div>
            </div>
        )
    }

    const mainVideos = course.videos.filter(v => v.type === 'main')
    const supplementaryVideos = course.videos.filter(v => v.type === 'supplementary')
    const completedVideoIds = videoProgress.filter(vp => vp.is_completed).map(vp => vp.video_id)
    const allVideosCompleted = course.videos.every(v => completedVideoIds.includes(v.id))
    const comprehensiveQuiz = quizzes.find(q => !q.video_id)
    const completionPercentage = course.videos.length > 0
        ? Math.round((completedVideoIds.filter(id => course.videos.some(v => v.id === id)).length / course.videos.length) * 100)
        : 0

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-howl-header text-white shadow-lg" style={{ backgroundColor: '#1E3535' }}>
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-2xl hover:scale-110 transition-transform">
                            ←
                        </Link>
                        <div>
                            <img
                                src="/logo-member.png"
                                alt="HOWL"
                                className="h-10 w-auto"
                                style={{ height: '40px', width: 'auto' }}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Current Video */}
                        {mainVideos.length > 0 && (
                            <div className="relative mb-6">
                                <div
                                    className="aspect-video w-full rounded-2xl overflow-hidden shadow-xl"
                                    style={{ border: '3px solid #C9A227' }}
                                >
                                    <LoomPlayer
                                        loomId={mainVideos[0].video_id}
                                        title={mainVideos[0].title}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Chapter Title */}
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2">
                                    {course.title}
                                </h1>
                                <p className="text-[#8B7355] flex items-center gap-2">
                                    {course.description}
                                </p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-6 border-b mb-6" style={{ borderColor: '#E8E0D0' }}>
                            <button className="pb-3 border-b-2 border-[#2D4A4A] font-medium text-[#2D2D2D]">概要</button>
                            <button className="pb-3 text-[#8B7355] hover:text-[#2D2D2D]">ノート</button>
                        </div>

                        {/* Course Description */}
                        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm" style={{ border: '1px solid #E8E0D0' }}>
                            <p className="text-[#2D2D2D] mb-4">
                                {course.description || "この講座では以下の内容を学習します。"}
                            </p>
                        </div>

                        {/* All Videos */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-[#2D4A4A]">
                                講座内容
                            </h3>

                            {[...mainVideos, ...supplementaryVideos].map((video, index) => {
                                const isCompleted = completedVideoIds.includes(video.id)
                                const isCompleting = completingVideo === video.id
                                const thumbnail = thumbnailByVideoId[video.id] ?? null

                                return (
                                    <div
                                        key={video.id}
                                        className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm transition-all hover:shadow-md"
                                        style={{
                                            border: isCompleted ? '2px solid #4A7C6F' : '1px solid #E8E0D0'
                                        }}
                                    >
                                        {/* Thumbnail */}
                                        <div
                                            className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 relative"
                                            style={{
                                                backgroundImage: thumbnail
                                                    ? `url(${thumbnail})`
                                                    : undefined,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                background: thumbnail
                                                    ? undefined
                                                    : `linear-gradient(135deg, ${index % 2 === 0 ? '#8B7355' : '#2D4A4A'} 0%, ${index % 2 === 0 ? '#5C4A3A' : '#1E3535'} 100%)`,
                                            }}
                                        >
                                            {thumbnail && <div className="absolute inset-0 bg-black/10" />}
                                            {isCompleted && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <span className="text-white text-sm font-bold">完</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-[#2D2D2D] truncate">{video.title}</h4>
                                            <p className="text-sm text-[#8B7355]">
                                                {video.type === 'main' ? 'メイン講義' : '補足資料'}
                                            </p>
                                        </div>

                                        {/* Action */}
                                        <button
                                            onClick={() => handleMarkComplete(video.id)}
                                            disabled={isCompleted || isCompleting}
                                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                                            style={{
                                                background: isCompleted ? '#4A7C6F' : '#FAF7F0',
                                                color: isCompleted ? 'white' : '#8B7355',
                                                border: isCompleted ? 'none' : '1px solid #E8E0D0'
                                            }}
                                        >
                                            {isCompleting ? (
                                                <span className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                </span>
                                            ) : isCompleted ? (
                                                '完了済み'
                                            ) : (
                                                '完了にする'
                                            )}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:w-80 space-y-6">
                        {/* Progress Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: '1px solid #E8E0D0' }}>
                            <h3 className="font-semibold text-[#2D4A4A] mb-4 flex items-center gap-2">
                                現在の進捗
                            </h3>

                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[#6B6B6B]">完了率</span>
                                <span className="font-semibold text-[#4A7C6F]">{completionPercentage}%</span>
                            </div>
                            <div className="h-3 bg-[#E8E0D0] rounded-full overflow-hidden mb-6">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${completionPercentage}%`,
                                        background: 'linear-gradient(90deg, #4A7C6F 0%, #8B7BB8 100%)'
                                    }}
                                />
                            </div>

                            {/* Test Button */}
                            {comprehensiveQuiz && (
                                <>
                                    {allVideosCompleted ? (
                                        <Link
                                            href={`/courses/${courseId}/quiz/${comprehensiveQuiz.id}`}
                                            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                                            style={{ background: 'linear-gradient(135deg, #8B7BB8 0%, #6B5A9E 100%)' }}
                                        >
                                            テストを開始
                                        </Link>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full py-3 bg-[#E8E0D0] text-[#8B7355] rounded-xl font-semibold cursor-not-allowed text-sm"
                                        >
                                            全ての動画を完了させてください
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Up Next */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: '1px solid #E8E0D0' }}>
                            <h3 className="font-semibold text-[#2D4A4A] mb-4">
                                次の講座
                            </h3>

                            <div className="space-y-3">
                                {course.videos.slice(0, 4).map((video, i) => {
                                    const isCompleted = completedVideoIds.includes(video.id)
                                    return (
                                        <div key={video.id} className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0"
                                                style={{
                                                    background: isCompleted
                                                        ? '#4A7C6F'
                                                        : i === completedVideoIds.length
                                                            ? '#8B7BB8'
                                                            : '#E8E0D0'
                                                }}
                                            >
                                                {isCompleted ? '完' : i + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-[#2D2D2D] text-sm truncate">{video.title}</p>
                                                <p className="text-xs text-[#8B7355]">
                                                    {isCompleted ? '完了済み' : i === completedVideoIds.length ? '再生中' : '未完了'}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
