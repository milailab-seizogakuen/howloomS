'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ApprovalPendingPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleLogout = async () => {
        setIsLoading(true)
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    useEffect(() => {
        const checkApproval = async () => {
            const authRes = await fetch('/api/auth/me')
            if (!authRes.ok) { router.push('/login'); return }

            const profileRes = await fetch('/api/profile')
            if (profileRes.ok) {
                const { profile } = await profileRes.json()
                if (profile?.is_approved) router.push('/dashboard')
            }
        }
        checkApproval()
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            {/* Decorative corners */}
            <div className="fixed top-0 left-0 w-32 h-32 bg-[#E8E0D0] opacity-40" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
            <div className="fixed bottom-0 right-0 w-24 h-64 bg-[#D4C8B8] opacity-30" />

            <div className="w-full max-w-lg text-center">
                {/* Logo */}
                <div className="mb-8">
                    <img
                        src="/logo-member.png"
                        alt="HOWL"
                        className="w-64 h-auto mx-auto"
                    />
                </div>

                {/* Card */}
                <div
                    className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl"
                    style={{ border: '2px solid #C9A227' }}
                >
                    {/* Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
                        <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-[#2D4A4A] mb-4">
                        承認待ち
                    </h1>

                    <p className="text-[#6B6B6B] mb-6 leading-relaxed">
                        アカウントの登録が完了しました。<br />
                        管理者による承認をお待ちください。<br />
                        <span className="text-sm text-[#8B7355]">
                            承認後、自動的にアクセスできるようになります。
                        </span>
                    </p>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-amber-800">
                            通常、承認には1〜2営業日かかります。<br />
                            お急ぎの場合は、管理者にお問い合わせください。
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                        style={{
                            background: '#FAF7F0',
                            color: '#8B7355',
                            border: '1px solid #E8E0D0'
                        }}
                    >
                        {isLoading ? 'ログアウト中...' : 'ログアウト'}
                    </button>
                </div>
            </div>
        </div>
    )
}
