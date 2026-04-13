'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import TagFilter from '@/components/TagFilter'
import TagBadge from '@/components/TagBadge'
import { getAllVideos } from '@/lib/api'
import type { Profile, VideoWithTags, VideoTag } from '@/types/database'

interface FilterState {
    typeTag?: string
    themeTags: string[]
    mode: 'AND' | 'OR'
}

interface DashboardClientProps {
    profile: Profile
}

function DashboardContent({ profile }: DashboardClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [videos, setVideos] = useState<VideoWithTags[]>([])
    const [filteredVideos, setFilteredVideos] = useState<VideoWithTags[]>([])
    const [loading, setLoading] = useState(true)
    const [thumbnailByVideoId, setThumbnailByVideoId] = useState<Record<string, string | null>>({})
    const [filterState, setFilterState] = useState<FilterState>({
        themeTags: [],
        mode: 'AND',
    })

    // URL からフィルタ状態を復元
    useEffect(() => {
        const typeTag = searchParams.get('type') || undefined
        const themeTags = searchParams.get('tags')?.split(',').filter(Boolean) || []
        const mode = (searchParams.get('mode') as 'AND' | 'OR') || 'AND'

        const newFilterState = { typeTag, themeTags, mode }
        setFilterState(newFilterState)
    }, [searchParams])

    // 動画を読み込む
    useEffect(() => {
        loadVideos()
    }, [])

    // フィルタ状態が変わったら適用
    useEffect(() => {
        if (videos.length > 0) {
            applyFilters(videos, filterState)
        }
    }, [videos, filterState])

    async function loadVideos() {
        try {
            setLoading(true)
            const allVideos = await getAllVideos()
            setVideos(allVideos as VideoWithTags[])
        } catch (error) {
            console.error('Failed to load videos:', error)
        } finally {
            setLoading(false)
        }
    }

    // Loom thumbnail をまとめて取得（クライアント→自前API→Loom oEmbed）
    useEffect(() => {
        if (!videos || videos.length === 0) return

        let cancelled = false

        const run = async () => {
            const nextMap: Record<string, string | null> = {}

            await Promise.all(
                videos.map(async (video) => {
                    // DBカラム名が migration で video_url に変わっているため両対応
                    const videoUrl = (video as any).video_url || (video as any).youtube_url
                    const loomId = (video as any).video_id

                    // 既に取得済みならスキップ
                    if (thumbnailByVideoId[video.id] !== undefined) return

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
    }, [videos])

    function applyFilters(videosList: VideoWithTags[], filters: FilterState) {
        const { typeTag, themeTags, mode } = filters

        if (!typeTag && themeTags.length === 0) {
            setFilteredVideos(videosList)
            return
        }

        let filtered = videosList

        // 講座タイプでフィルタ
        if (typeTag) {
            filtered = filtered.filter(video =>
                video.video_tags?.some(vt => vt.tag_id === typeTag)
            )
        }

        // テーマタグでフィルタ
        if (themeTags.length > 0) {
            if (mode === 'AND') {
                // すべてのテーマタグを持つ
                filtered = filtered.filter(video => {
                    const videoTagIds = video.video_tags?.map(vt => vt.tag_id) || []
                    return themeTags.every(themeTag => videoTagIds.includes(themeTag))
                })
            } else {
                // いずれかのテーマタグを持つ
                filtered = filtered.filter(video => {
                    const videoTagIds = video.video_tags?.map(vt => vt.tag_id) || []
                    return themeTags.some(themeTag => videoTagIds.includes(themeTag))
                })
            }
        }

        setFilteredVideos(filtered)
    }

    const handleFilterChange = useCallback(
        (filters: {
            typeTag?: string
            themeTags: string[]
            mode: 'AND' | 'OR'
        }) => {
            setFilterState(filters)

            // URL を更新（ブックマーク可能にする）
            const params = new URLSearchParams()
            if (filters.typeTag) params.set('type', filters.typeTag)
            if (filters.themeTags.length > 0) params.set('tags', filters.themeTags.join(','))
            if (filters.mode === 'OR') params.set('mode', filters.mode)

            const newUrl = params.toString() ? `/dashboard?${params.toString()}` : '/dashboard'
            router.push(newUrl)
        },
        [router]
    )

    // Get thumbnail - Loom thumbnails: Phase 2対応
    function getThumbnail(video: VideoWithTags) {
        return thumbnailByVideoId[video.id] ?? null
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 左：タグフィルタ */}
            <div className="lg:col-span-1">
                <TagFilter
                    onFilterChange={handleFilterChange}
                    initialFilters={filterState}
                />
            </div>

            {/* 右：動画一覧 */}
            <div className="lg:col-span-3">
                {loading ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-[#E8E0D0]">
                        <p className="text-[#8B7355]">動画を読み込み中...</p>
                    </div>
                ) : filteredVideos.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-[#E8E0D0]">
                        <p className="text-[#8B7355] mb-4">該当する動画がありません</p>
                        <button
                            onClick={() => {
                                setFilterState({ themeTags: [], mode: 'AND' })
                                router.push('/dashboard')
                            }}
                            className="text-[#4A7C6F] hover:underline"
                        >
                            フィルタをリセット
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-[#8B7355] font-semibold">
                            {filteredVideos.length} 件の動画
                        </p>
                        <div className="grid gap-4 md:grid-cols-2">
                            {filteredVideos.map(video => {
                                const thumbnail = getThumbnail(video)
                                return (
                                    <a
                                        key={video.id}
                                        href={`/courses/${video.course_id}`}
                                        className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 block border border-[#E8E0D0]"
                                    >
                                        {/* Thumbnail */}
                                        <div
                                            className="h-40 relative bg-cover bg-center"
                                            style={{
                                                backgroundImage: thumbnail
                                                    ? `url(${thumbnail})`
                                                    : 'linear-gradient(135deg, #4A7C6F 0%, #2D4A4A 100%)'
                                            }}
                                        >
                                            {thumbnail && <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition" />}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                                                    <span className="text-2xl">▶</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                {video.type === 'main' ? (
                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                                        本講座
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                                        補足動画
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-[#2D2D2D] mb-3 line-clamp-2 min-h-[3rem]">
                                                {video.title}
                                            </h3>

                                            {/* タグ表示 */}
                                            {video.video_tags && video.video_tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {video.video_tags.map((vt: VideoTag) => (
                                                        <TagBadge key={vt.tag_id} tag={vt.tags} />
                                                    ))}
                                                </div>
                                            )}

                                            <button
                                                className="w-full py-2 rounded-lg font-medium text-sm transition-all"
                                                style={{
                                                    background: '#4A7C6F',
                                                    color: 'white',
                                                }}
                                            >
                                                視聴する
                                            </button>
                                        </div>
                                    </a>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function DashboardClient({ profile }: DashboardClientProps) {
    return (
        <Suspense fallback={<div className="text-center py-12 text-[#8B7355]">読み込み中...</div>}>
            <DashboardContent profile={profile} />
        </Suspense>
    )
}
