import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!)
export const COOKIE_NAME = 'howl_session'
const EXPIRES_IN = 60 * 60 * 24 * 7 // 7日間（秒）

export interface SessionPayload {
    userId: string       // profiles.id
    email: string
    name: string
    isAdmin: boolean
    isApproved: boolean
}

/** JWT を生成して文字列で返す */
export async function signJwt(payload: SessionPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${EXPIRES_IN}s`)
        .sign(SECRET)
}

/** JWT を検証してペイロードを返す。無効なら null */
export async function verifyJwt(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET)
        return payload as unknown as SessionPayload
    } catch {
        return null
    }
}

/** Set-Cookie ヘッダー文字列を生成 */
export function buildSetCookie(token: string): string {
    return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${EXPIRES_IN}; SameSite=Lax`
}

/** Cookie 削除用の Set-Cookie ヘッダー文字列 */
export function buildClearCookie(): string {
    return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
}
