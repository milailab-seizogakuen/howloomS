'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { profileSchema, AI_TOOLS_OPTIONS, type ProfileFormData } from '@/lib/validations/profile'



export default function OnboardingPage() {
    const router = useRouter()
    const [userEmail, setUserEmail] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const [step, setStep] = useState(1)

    const [formData, setFormData] = useState<ProfileFormData>({
        name: '',
        has_met: false,
        ai_tools: [],
        motivation: '',
    })

    // Use standard labels from AI_TOOLS_OPTIONS directly
    const LOCALIZED_AI_TOOLS_OPTIONS = AI_TOOLS_OPTIONS

    useEffect(() => {
        const fetchUser = async () => {
            const res = await fetch('/api/auth/me')
            if (!res.ok) { router.push('/login'); return }
            const { user } = await res.json()

            // すでにプロフィールが存在するか確認
            const profileRes = await fetch('/api/profile')
            if (profileRes.ok) {
                const { profile } = await profileRes.json()
                if (profile) { router.push('/dashboard'); return }
            }

            setUserEmail(user.email)
            setFormData(prev => ({ ...prev, name: user.name || '' }))
            setIsLoading(false)
        }
        fetchUser()
    }, [router])

    const handleAiToolChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            ai_tools: prev.ai_tools.includes(value)
                ? prev.ai_tools.filter(tool => tool !== value)
                : [...prev.ai_tools, value],
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setValidationErrors({})

        const result = profileSchema.safeParse(formData)
        if (!result.success) {
            const errors: Record<string, string> = {}
            result.error.issues.forEach((issue) => {
                if (issue.path[0]) {
                    errors[issue.path[0].toString()] = issue.message
                }
            })
            setValidationErrors(errors)
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    has_met: formData.has_met,
                    ai_tools: formData.ai_tools,
                    motivation: formData.motivation,
                    is_approved: false,
                    is_admin: false,
                    avatar_url: null,
                })
            })
            if (!res.ok) throw new Error('insert failed')
            router.push('/approval-pending')
        } catch {
            setError('保存に失敗しました。もう一度お試しください。')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#E8E0D0] border-t-[#8B7BB8] rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-[#8B7355]">
                        読み込み中...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            {/* Decorative elements */}
            <div className="fixed top-0 left-0 w-32 h-32 bg-[#E8E0D0] opacity-40" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
            <div className="fixed bottom-0 right-0 w-24 h-64 bg-[#D4C8B8] opacity-30" />

            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#2D2D2D] mt-4 mb-2">
                        ようこそ
                    </h1>
                    <p className="text-[#8B7355]">
                        プロフィールを入力してください
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${s === step
                                ? 'bg-[#8B7BB8] text-white scale-110'
                                : s < step
                                    ? 'bg-[#4A7C6F] text-white'
                                    : 'bg-[#E8E0D0] text-[#8B7355]'
                                }`}
                        >
                            {s < step ? '✓' : s}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div
                    className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl"
                    style={{ border: '2px solid #C9A227' }}
                >
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Step 1: Name */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-[#2D4A4A] mb-4">
                                    基本情報
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium text-[#8B7355] mb-2">
                                        名前 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#8B7BB8] focus:border-[#8B7BB8] transition-all text-lg"
                                        style={{ borderColor: '#E8E0D0' }}
                                        placeholder="名前を入力"
                                    />
                                    {validationErrors.name && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                                    )}
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

                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    disabled={!formData.name}
                                    className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #8B7BB8 0%, #6B5A9E 100%)' }}
                                >
                                    次へ →
                                </button>
                            </div>
                        )}

                        {/* Step 2: AI Tools */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-[#2D4A4A] mb-4">
                                    使用しているAIツール
                                </h2>

                                <div className="space-y-3">
                                    {LOCALIZED_AI_TOOLS_OPTIONS.map(option => (
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
                                            {formData.ai_tools.includes(option.value) && (
                                                <span className="ml-auto">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {validationErrors.ai_tools && (
                                    <p className="text-sm text-red-600">{validationErrors.ai_tools}</p>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-3 border-2 rounded-xl font-medium text-[#8B7355]"
                                        style={{ borderColor: '#E8E0D0' }}
                                    >
                                        ← 戻る
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        disabled={formData.ai_tools.length === 0}
                                        className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
                                        style={{ background: 'linear-gradient(135deg, #8B7BB8 0%, #6B5A9E 100%)' }}
                                    >
                                        次へ →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Motivation */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-[#2D4A4A] mb-4">
                                    意気込み
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium text-[#8B7355] mb-2">
                                        学習目的などを入力してください <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.motivation}
                                        onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
                                        rows={5}
                                        className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#8B7BB8] focus:border-[#8B7BB8] transition-all resize-none"
                                        style={{ borderColor: '#E8E0D0' }}
                                        placeholder="200文字以内で入力してください..."
                                        maxLength={200}
                                    />
                                    <div className="flex justify-between mt-1">
                                        {validationErrors.motivation && (
                                            <p className="text-sm text-red-600">{validationErrors.motivation}</p>
                                        )}
                                        <p className="text-sm text-[#8B7355] ml-auto">{formData.motivation.length}/200</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="flex-1 py-3 border-2 rounded-xl font-medium text-[#8B7355]"
                                        style={{ borderColor: '#E8E0D0' }}
                                    >
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
                                        ) : (
                                            <>
                                                はじめる
                                            </>
                                        )}
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
