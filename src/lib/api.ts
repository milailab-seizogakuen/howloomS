/**
 * src/lib/api.ts
 * クライアントサイドからデータを取得するためのヘルパー関数
 * Supabase クライアントを廃止し、すべて自前の API Route 経由に変更
 */

export interface Tag {
    id: string
    name: string
    category: 'type' | 'theme'
    color_code: string
    display_order: number
}

export interface VideoTag {
    tag_id: string
    tags: Tag
}

export async function getTags(): Promise<Tag[]> {
    const res = await fetch('/api/tags')
    if (!res.ok) throw new Error('Failed to fetch tags')
    const { tags } = await res.json()
    return (tags || []).sort((a: Tag, b: Tag) => (a.display_order ?? 0) - (b.display_order ?? 0))
}

export async function getTypeTags(): Promise<Omit<Tag, 'category'>[]> {
    const tags = await getTags()
    return tags.filter(t => t.category === 'type')
}

export async function getThemeTags(): Promise<Omit<Tag, 'category'>[]> {
    const tags = await getTags()
    return tags.filter(t => t.category === 'theme')
}

export async function getAllVideos() {
    const res = await fetch('/api/videos')
    if (!res.ok) throw new Error('Failed to fetch videos')
    const { videos } = await res.json()
    return videos || []
}
