import { NextResponse } from 'next/server'
import { getProfileByEmail } from '@/lib/sheets'
import bcrypt from 'bcryptjs'
import { signJwt, buildSetCookie } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()
        if (!email || !password) {
            return NextResponse.json({ error: 'メールアドレスとパスワードを入力してください' }, { status: 400 })
        }

        console.log('[login] 1. Looking up profile for:', email)
        console.log('[login] USERS_SS:', process.env.GOOGLE_SHEETS_USERS_SPREADSHEET_ID)
        console.log('[login] SA email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)

        const profile = await getProfileByEmail(email)
        console.log('[login] 2. Profile found:', !!profile, 'has_password:', !!profile?.hashed_password)

        if (!profile || !profile.hashed_password) {
            return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 })
        }

        const isValid = await bcrypt.compare(password, profile.hashed_password)
        console.log('[login] 3. Password valid:', isValid)

        if (!isValid) {
            return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 })
        }

        const token = await signJwt({
            userId: profile.id,
            email,
            name: profile.name,
            isAdmin: profile.is_admin,
            isApproved: profile.is_approved,
        })

        const response = NextResponse.json({ ok: true, isApproved: profile.is_approved })
        response.headers.set('Set-Cookie', buildSetCookie(token))
        return response
    } catch (e: unknown) {
        const err = e as Error
        console.error('[login] ERROR:', err.message)
        console.error('[login] STACK:', err.stack)
        return NextResponse.json({ error: 'サーバーエラーが発生しました', detail: err.message }, { status: 500 })
    }
}
