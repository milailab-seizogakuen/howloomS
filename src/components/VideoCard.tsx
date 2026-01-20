'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import YouTubePlayer from '@/components/YouTubePlayer'
import type { Video, VideoProgress } from '@/types/database'

interface VideoCardProps {
    video: Video
    progress: VideoProgress | null
    onComplete: (videoId: string) => void
}

export default function VideoCard({ video, progress, onComplete }: VideoCardProps) {
    const [isCompleting, setIsCompleting] = useState(false)
    const [isCompleted, setIsCompleted] = useState(progress?.is_completed || false)

    const handleMarkComplete = async () => {
        if (isCompleted) return

        setIsCompleting(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            // Upsert video progress
            const { error } = await supabase
                .from('video_progress')
                .upsert({
                    user_id: user.id,
                    video_id: video.id,
                    is_completed: true,
                    completed_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,video_id',
                })

            if (!error) {
                setIsCompleted(true)
                onComplete(video.id)
            }
        } catch (error) {
            console.error('Failed to mark video as complete:', error)
        } finally {
            setIsCompleting(false)
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <YouTubePlayer videoId={video.video_id} title={video.title} />

            <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            {video.type === 'main' ? (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                    本講座
                                </span>
                            ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                    補足動画
                                </span>
                            )}
                            {isCompleted && (
                                <span className="text-emerald-500 font-bold">✓</span>
                            )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mt-2">
                            {video.title}
                        </h3>
                    </div>
                </div>

                <button
                    onClick={handleMarkComplete}
                    disabled={isCompleted || isCompleting}
                    className={`w-full mt-4 py-2 px-4 rounded-xl font-medium transition-colors ${isCompleted
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                >
                    {isCompleting ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            処理中...
                        </span>
                    ) : isCompleted ? (
                        '視聴完了済み'
                    ) : (
                        '視聴完了にする'
                    )}
                </button>
            </div>
        </div>
    )
}
