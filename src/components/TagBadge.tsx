'use client'

interface Tag {
    id: string
    name: string
    color_code: string
}

interface TagBadgeProps {
    tag: Tag
}

export default function TagBadge({ tag }: TagBadgeProps) {
    return (
        <span
            className="inline-block px-2 py-1 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: tag.color_code }}
        >
            {tag.name}
        </span>
    )
}
