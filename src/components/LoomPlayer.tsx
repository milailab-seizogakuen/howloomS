'use client'

interface LoomPlayerProps {
    loomId: string
    title?: string
}

export default function LoomPlayer({ loomId, title }: LoomPlayerProps) {
    if (!loomId || loomId.trim() === '') {
        return (
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
                <p className="text-gray-600">動画が利用できません</p>
            </div>
        )
    }

    return (
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-900">
            <iframe
                src={`https://www.loom.com/embed/${loomId}?hideEmbedTopBar=true&hide_owner=true&hide_title=true`}
                title={title || 'Loom video player'}
                allowFullScreen
                className="w-full h-full"
            />
        </div>
    )
}
