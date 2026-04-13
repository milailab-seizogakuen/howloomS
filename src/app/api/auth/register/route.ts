import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signJwt, buildSetCookie } from '@/lib/auth'
import { getProfileByEmail, insertProfile } from '@/lib/sheets'

export async function POST(request: Request) {
    try {
        const { email, password, name, has_met, ai_tools, motivation } = await request.json()

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'メールアドレス・パスワード・名前は必須です' }, { status: 400 })
        }
        if (password.length < 8) {
            return NextResponse.json({ error: 'パスワードは8文字以上で設定してください' }, { status: 400 })
        }

        // メール重複チェック
        const existing = await getProfileByEmail(email)
        if (existing) {
            return NextResponse.json({ error: 'このメールアドレスはすでに登録されています' }, { status: 409 })
        }

        // パスワードハッシュ化
        const hashed_password = await bcrypt.hash(password, 10)

        // プロフィール登録（is_approved: false で承認待ち）
        await insertProfile({
            id: crypto.randomUUID(),
            email,
            hashed_password,
            name,
            avatar_url: null,
            has_met: has_met ?? false,
            ai_tools: ai_tools ?? [],
            motivation: motivation ?? '',
            is_admin: false,
            is_approved: false,
        })

        // JWT発行
        const token = await signJwt({
            userId: crypto.randomUUID(), // プロフィールIDはシートから再取得するが、ここでは暫定
            email,
            name,
            isAdmin: false,
            isApproved: false,
        })

        // 正確なIDでJWTを発行するために再取得
        const profile = await getProfileByEmail(email)
        const finalToken = await signJwt({
            userId: profile?.id ?? '',
            email,
            name,
            isAdmin: false,
            isApproved: false,
        })

        const response = NextResponse.json({ ok: true })
        response.headers.set('Set-Cookie', buildSetCookie(finalToken))
        return response
    } catch (e: unknown) {
        const err = e as Error
        console.error('[register] ERROR:', err.message)
        return NextResponse.json({ error: 'サーバーエラーが発生しました', detail: err.message }, { status: 500 })
    }
}
