'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// useSearchParams を使うコンポーネントは Suspense でラップが必要
function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const oauthError = searchParams.get('error')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error ?? 'ログインに失敗しました')
                return
            }

            if (!data.isApproved) {
                router.push('/approval-pending')
            } else {
                router.push('/dashboard')
            }
        } catch {
            setError('接続エラーが発生しました。再度お試しください。')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            {/* Decorative corners */}
            <div className="fixed top-0 left-0 w-32 h-32 bg-[#E8E0D0] opacity-40" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
            <div className="fixed bottom-0 left-0 w-24 h-64 bg-[#D4C8B8] opacity-30" />

            <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24">
                {/* Left Side - Branding */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                    <div className="relative mb-8">
                        <img
                            src="/logo.png"
                            alt="HOWL"
                            className="w-full max-w-md h-auto"
                            style={{ maxWidth: '400px', width: '100%', height: 'auto', display: 'block' }}
                        />
                    </div>
                </div>

                {/* Right Side - Login Card */}
                <div
                    className="w-full max-w-sm bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl"
                    style={{ border: '1px solid #E8E0D0' }}
                >
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold tracking-wide text-[#2D2D2D]">
                            ログイン / 新規登録
                        </h2>
                        <p className="text-sm text-[#6B6B6B] mt-2">
                            メールアドレスとパスワードを入力してください
                        </p>
                    </div>

                    {(error || oauthError) && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            {error ?? (
                                oauthError === 'oauth_cancelled'
                                    ? 'Googleログインがキャンセルされました'
                                    : 'Googleログインに失敗しました。再度お試しください。'
                            )}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                メールアドレス
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                autoComplete="email"
                                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-[#8B7BB8] transition-colors"
                                style={{ borderColor: '#E8E0D0' }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                                パスワード
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-[#8B7BB8] transition-colors"
                                style={{ borderColor: '#E8E0D0' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !email || !password}
                            className="w-full py-3 bg-[#8B7BB8] text-white rounded-xl font-medium hover:bg-[#7A6AA7] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'ログイン中...' : 'ログイン'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[#8B7355] mt-6">
                        アカウントをお持ちでない方は{' '}
                        <a href="/signup" className="text-[#8B7BB8] font-medium hover:underline">
                            新規登録
                        </a>
                    </p>


                    {/* 区切り線 */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-[#E8E0D0]" />
                        <span className="text-xs text-[#8B7355]">または</span>
                        <div className="flex-1 h-px bg-[#E8E0D0]" />
                    </div>

                    {/* Google ログインボタン */}
                    <a
                        href="/api/auth/google/redirect"
                        className="flex items-center justify-center gap-3 w-full py-3 rounded-xl border-2 font-medium text-[#2D2D2D] transition-all hover:bg-[#FAF7F0] hover:border-[#C9C0B0]"
                        style={{ borderColor: '#E8E0D0', background: '#fff' }}
                    >
                        {/* Google SVG アイコン */}
                        <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
                            <path d="M6.3 14.7l7 5.1C15.2 16.5 19.3 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.3-17.7 11.7z" fill="#FF3D00"/>
                            <path d="M24 45c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.6C29.6 35.9 27 37 24 37c-6 0-10.6-3.9-12-9.3l-7 5.4C8.2 40.7 15.5 45 24 45z" fill="#4CAF50"/>
                            <path d="M44.5 20H24v8.5h11.8c-.9 2.6-2.7 4.8-5.2 6.3l6.6 5.6C41.3 37.1 45 31 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
                        </svg>
                        Googleでログイン
                    </a>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    )
}
