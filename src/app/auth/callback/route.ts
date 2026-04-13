import { NextResponse } from 'next/server'

// NextAuth.js OAuthコールバックは廃止。
// カスタムJWT認証に移行したため、このルートは /dashboard にリダイレクトする。
// フェーズ4でこのファイルごと削除予定。
export async function GET() {
    return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))
}
