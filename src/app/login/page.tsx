'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
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
                            ログイン
                        </h2>
                        <p className="text-sm text-[#6B6B6B] mt-2">
                            メールアドレスとパスワードを入力してください
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            {error}
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
                </div>
            </div>
        </div>
    )
}
