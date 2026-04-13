'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AI_TOOLS_OPTIONS } from '@/lib/validations/profile'

export default function SignupPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        name: '',
        has_met: false,
        ai_tools: [] as string[],
        motivation: '',
    })

    const handleAiToolChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            ai_tools: prev.ai_tools.includes(value)
                ? prev.ai_tools.filter(t => t !== value)
                : [...prev.ai_tools, value],
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.password !== formData.passwordConfirm) {
            setError('パスワードが一致しません')
            return
        }
        setError(null)
        setIsSubmitting(true)
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    has_met: formData.has_met,
                    ai_tools: formData.ai_tools,
                    motivation: formData.motivation,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error ?? '登録に失敗しました')
                return
            }
            router.push('/approval-pending')
        } catch {
            setError('通信エラーが発生しました。もう一度お試しください。')
        } finally {
            setIsSubmitting(false)
        }
    }

    const totalSteps = 4

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(135deg, #FAF7F0 0%, #F0EBE3 100%)' }}>
            {/* Decorative */}
            <div className="fixed top-0 left-0 w-32 h-32 bg-[#E8E0D0] opacity-40" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
            <div className="fixed bottom-0 right-0 w-24 h-64 bg-[#D4C8B8] opacity-30" />

            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #8B7BB8 0%, #6B5A9E 100%)' }}>
                        H
                    </div>
                    <h1 className="text-3xl font-bold text-[#2D2D2D] mb-1">新規登録</h1>
                    <p className="text-[#8B7355]">Howl Moving School へようこそ</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${s === step
                                        ? 'bg-[#8B7BB8] text-white scale-110 shadow-md'
                                        : s < step
                                            ? 'bg-[#4A7C6F] text-white'
                                            : 'bg-[#E8E0D0] text-[#8B7355]'
                                    }`}
                            >
                                {s < step ? '✓' : s}
                            </div>
                            {s < totalSteps && (
                                <div className={`w-8 h-1 mx-1 rounded ${s < step ? 'bg-[#4A7C6F]' : 'bg-[#E8E0D0]'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl" style={{ border: '2px solid #C9A227' }}>
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {/* ── Step 1: アカウント情報 ── */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <h2 className="text-xl font-semibold text-[#2D4A4A] mb-4">アカウント情報</h2>

                                <div>
                                    <label className="block text-sm font-medium text-[#8B7355] mb-2">
                                        メールアドレス <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#8B7BB8] focus:border-[#8B7BB8] transition-all"
                                        style={{ borderColor: '#E8E0D0' }}
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#8B7355] mb-2">
                                        パスワード <span className="text-red-500">*</span>
                                        <span className="text-xs text-[#B0A090] ml-2">（8文字以上）</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#8B7BB8] focus:border-[#8B7BB8] transition-all"
                                        style={{ borderColor: '#E8E0D0' }}
                                        placeholder="••••••••"
                                        minLength={8}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#8B7355] mb-2">
                                        パスワード（確認） <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.passwordConfirm}
                                        onChange={e => setFormData(prev => ({ ...prev, passwordConfirm: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#8B7BB8] focus:border-[#8B7BB8] transition-all"
                                        style={{ borderColor: '#E8E0D0' }}
                                        placeholder="••••••••"
                                        required
                                    />
                                    {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
                                        <p className="mt-1 text-xs text-red-500">パスワードが一致しません</p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (formData.password !== formData.passwordConfirm) {
                                            setError('パスワードが一致しません')
                                            return
                                        }
                                        setError(null)
                                        setStep(2)
                                    }}
                                    disabled={!formData.email || !formData.password || formData.password.length < 8}
                                    className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 transition-all hover:brightness-110"
                                    style={{ background: 'linear-gradient(135deg, #8B7BB8 0%, #6B5A9E 100%)' }}
                                >
                                    次へ →
                                </button>

                                <p className="text-center text-sm text-[#8B7355]">
                                    すでにアカウントをお持ちの方は{' '}
                                    <Link href="/login" className="text-[#8B7BB8] font-medium hover:underline">
                                        ログイン
                                    </Link>
                                </p>
                            </div>
                        )}

                        {/* ── Step 2: 基本情報 ── */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-[#2D4A4A] mb-4">基本情報</h2>

                                <div>
                                    <label className="block text-sm font-medium text-[#8B7355] mb-2">
                                        名前 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#8B7BB8] focus:border-[#8B7BB8] transition-all text-lg"
                                        style={{ borderColor: '#E8E0D0' }}
                                        placeholder="名前を入力"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#8B7355] mb-3">
                                        北さんと面識はありますか？ <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-4">
                                        {[true, false].map(value => (
                                            <button
                                                key={String(value)}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, has_met: value }))}
                                                className="flex-1 py-3 rounded-xl font-medium transition-all"
                                                style={{
                                                    background: formData.has_met === value ? '#8B7BB8' : '#FAF7F0',
                                                    color: formData.has_met === value ? 'white' : '#8B7355',
                                                    border: `2px solid ${formData.has_met === value ? '#8B7BB8' : '#E8E0D0'}`
                                                }}
                                            >
                                                {value ? 'はい' : 'いいえ'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setStep(1)}
                                        className="flex-1 py-3 border-2 rounded-xl font-medium text-[#8B7355]"
                                        style={{ borderColor: '#E8E0D0' }}>
                                        ← 戻る
                                    </button>
                                    <button type="button" onClick={() => setStep(3)}
                                        disabled={!formData.name}
                                        className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
                                        style={{ background: 'linear-gradient(135deg, #8B7BB8 0%, #6B5A9E 100%)' }}>
                                        次へ →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: AIツール ── */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-[#2D4A4A] mb-4">使用しているAIツール</h2>

                                <div className="space-y-3">
                                    {AI_TOOLS_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleAiToolChange(option.value)}
                                            className="w-full p-4 rounded-xl flex items-center gap-4 transition-all"
                                            style={{
                                                background: formData.ai_tools.includes(option.value) ? '#8B7BB8' : 'white',
                                                color: formData.ai_tools.includes(option.value) ? 'white' : '#2D2D2D',
                                                border: `2px solid ${formData.ai_tools.includes(option.value) ? '#8B7BB8' : '#E8E0D0'}`
                                            }}
                                        >
                                            <span className="font-medium">{option.label}</span>
                                            {formData.ai_tools.includes(option.value) && <span className="ml-auto">✓</span>}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setStep(2)}
                                        className="flex-1 py-3 border-2 rounded-xl font-medium text-[#8B7355]"
                                        style={{ borderColor: '#E8E0D0' }}>
                                        ← 戻る
                                    </button>
                                    <button type="button" onClick={() => setStep(4)}
                                        disabled={formData.ai_tools.length === 0}
                                        className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
                                        style={{ background: 'linear-gradient(135deg, #8B7BB8 0%, #6B5A9E 100%)' }}>
                                        次へ →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Step 4: 意気込み ── */}
                        {step === 4 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-[#2D4A4A] mb-4">意気込み</h2>

                                <div>
                                    <label className="block text-sm font-medium text-[#8B7355] mb-2">
                                        学習目的などを入力してください <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.motivation}
                                        onChange={e => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
                                        rows={5}
                                        className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#8B7BB8] focus:border-[#8B7BB8] transition-all resize-none"
                                        style={{ borderColor: '#E8E0D0' }}
                                        placeholder="200文字以内で入力してください..."
                                        maxLength={200}
                                    />
                                    <p className="text-sm text-[#8B7355] text-right mt-1">{formData.motivation.length}/200</p>
                                </div>

                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setStep(3)}
                                        className="flex-1 py-3 border-2 rounded-xl font-medium text-[#8B7355]"
                                        style={{ borderColor: '#E8E0D0' }}>
                                        ← 戻る
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !formData.motivation}
                                        className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                                        style={{ background: 'linear-gradient(135deg, #4A7C6F 0%, #3A5C5C 100%)' }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                登録中...
                                            </>
                                        ) : '登録する 🎉'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}
