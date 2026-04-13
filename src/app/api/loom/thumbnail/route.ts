import { NextRequest, NextResponse } from 'next/server'

type LoomOEmbedResponse = {
    thumbnail_url?: string
    title?: string
}

function buildLoomShareUrlFromId(id: string) {
    // Loom IDs are typically alphanumeric, sometimes include hyphens.
    // We keep this permissive and just trim.
    const trimmed = id.trim()
    return `https://www.loom.com/share/${trimmed}`
}

async function fetchLoomOEmbed(url: string) {
    const endpoints = [
        `https://www.loom.com/v1/oembed?url=${encodeURIComponent(url)}`,
        `https://www.loom.com/api/oembed?url=${encodeURIComponent(url)}`,
    ]

    let lastError: unknown = null
    for (const endpoint of endpoints) {
        try {
            const res = await fetch(endpoint, {
                // Cache on the Next.js server; thumbnails rarely change.
                next: { revalidate: 60 * 60 * 24 },
            })
            if (!res.ok) {
                lastError = new Error(`oEmbed request failed: ${res.status} ${res.statusText}`)
                continue
            }
            const json = (await res.json()) as LoomOEmbedResponse
            return json
        } catch (e) {
            lastError = e
        }
    }
    throw lastError ?? new Error('Failed to fetch Loom oEmbed')
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const id = searchParams.get('id')

    const loomUrl = url?.trim() || (id?.trim() ? buildLoomShareUrlFromId(id) : null)
    if (!loomUrl) {
        return NextResponse.json(
            { error: 'Missing url or id' },
            { status: 400 }
        )
    }

    try {
        const oembed = await fetchLoomOEmbed(loomUrl)
        return NextResponse.json(
            {
                url: loomUrl,
                thumbnail_url: oembed.thumbnail_url ?? null,
                title: oembed.title ?? null,
            },
            {
                status: 200,
                headers: {
                    // Help browser caching too (safe because we also revalidate server-side).
                    'Cache-Control': 'public, max-age=3600',
                },
            }
        )
    } catch (error) {
        console.error('Failed to fetch Loom thumbnail:', error)
        return NextResponse.json(
            { url: loomUrl, thumbnail_url: null },
            { status: 200 }
        )
    }
}

