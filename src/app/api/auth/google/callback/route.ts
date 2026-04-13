import { NextResponse } from 'next/server'
import { getProfileByEmail, insertProfile } from '@/lib/sheets'
import { signJwt, buildSetCookie } from '@/lib/auth'

interface GoogleTokenResponse {
    access_token: string
    token_type: string
    error?: string
}

interface GoogleUserInfo {
    email: string
    name: string
    picture?: string
    email_verified?: boolean
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    // ユーザーがキャンセルした場合
    if (error || !code) {
        return NextResponse.redirect(`${siteUrl}/login?error=oauth_cancelled`)
    }

    try {
        const clientId = process.env.GOOGLE_CLIENT_ID!
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
        const redirectUri = `${siteUrl}/api/auth/google/callback`

        // Step 1: code をアクセストークンに交換
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        })

        const tokenData = (await tokenRes.json()) as GoogleTokenResponse
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('[google/callback] Token exchange failed:', tokenData)
            return NextResponse.redirect(`${siteUrl}/login?error=token_exchange_failed`)
        }

        // Step 2: アクセストークンでユーザー情報を取得
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })

        if (!userInfoRes.ok) {
            return NextResponse.redirect(`${siteUrl}/login?error=userinfo_failed`)
        }

        const userInfo = (await userInfoRes.json()) as GoogleUserInfo
        const { email, name, picture } = userInfo

        if (!email) {
            return NextResponse.redirect(`${siteUrl}/login?error=no_email`)
        }

        // Step 3: スプシの profiles シートを確認
        let profile = await getProfileByEmail(email)

        if (!profile) {
            // 新規ユーザー → 承認待ちで登録
            await insertProfile({
                id: crypto.randomUUID(),
                email,
                hashed_password: null,          // Googleログインはパスワードなし
                name: name ?? email,
                avatar_url: picture ?? null,
                has_met: false,
                ai_tools: [],
                motivation: '',
                is_admin: false,
                is_approved: false,
            })
            // 登録直後のプロフィールを再取得
            profile = await getProfileByEmail(email)
        }

        if (!profile) {
            return NextResponse.redirect(`${siteUrl}/login?error=profile_creation_failed`)
        }

        // Step 4: JWT を発行して Cookie にセット
        const token = await signJwt({
            userId: profile.id,
            email,
            name: profile.name,
            isAdmin: profile.is_admin,
            isApproved: profile.is_approved,
        })

        const destination = profile.is_approved ? '/dashboard' : '/approval-pending'
        const response = NextResponse.redirect(`${siteUrl}${destination}`)
        response.headers.set('Set-Cookie', buildSetCookie(token))
        return response

    } catch (e: unknown) {
        const err = e as Error
        console.error('[google/callback] ERROR:', err.message)
        return NextResponse.redirect(`${siteUrl}/login?error=server_error`)
    }
}
