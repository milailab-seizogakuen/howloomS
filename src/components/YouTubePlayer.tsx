'use client'

interface YouTubePlayerProps {
    videoId: string
    title?: string
}

export default function YouTubePlayer({ videoId, title }: YouTubePlayerProps) {
    return (
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-900">
            <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={title || 'YouTube video player'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
            />
        </div>
    )
}
