'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'



export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const supabase = createClient()

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                if (error.message.includes('cancelled') || error.message.includes('canceled')) {
                    setError('ログインがキャンセルされました')
                } else {
                    setError('サーバーエラーが発生しました。しばらくお待ちください。')
                }
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
                    {/* Logo */}
                    <div className="relative mb-8">
                        <img
                            src="/logo.png"
                            alt="HOWL"
                            className="w-96 h-auto"
                        />
                    </div>
                </div>

                {/* Right Side - Login Card */}
                <div
                    className="w-full max-w-sm bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl"
                    style={{ border: '1px solid #E8E0D0' }}
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold tracking-wide text-[#2D2D2D]">
                            ログイン
                        </h2>
                        <p className="text-sm text-[#6B6B6B] mt-2">
                            Googleアカウントでログインしてください
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            <div className="flex items-center gap-2">
                                <span>{error}</span>
                            </div>
                            <button
                                onClick={handleGoogleLogin}
                                className="mt-2 text-red-600 underline text-sm hover:text-red-800"
                            >
                                再試行
                            </button>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-[#E8E0D0]" />
                        <span className="text-sm text-[#8B7355]">または</span>
                        <div className="flex-1 h-px bg-[#E8E0D0]" />
                    </div>

                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 rounded-xl bg-white hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                        style={{ borderColor: '#E8E0D0' }}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-[#8B7BB8] rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        )}
                        <span className="font-medium text-[#2D2D2D]">
                            {isLoading ? '処理中...' : 'Googleでログイン'}
                        </span>
                    </button>


                </div>
            </div>
        </div>
    )
}
