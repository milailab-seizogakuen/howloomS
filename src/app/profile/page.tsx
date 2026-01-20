'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { profileSchema, AI_TOOLS_OPTIONS, type ProfileFormData } from '@/lib/validations/profile'
import type { Profile } from '@/types/database'



export default function ProfilePage() {
    const router = useRouter()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    const [formData, setFormData] = useState<ProfileFormData>({
        name: '',
        has_met: false,
        ai_tools: [],
        motivation: '',
    })

    // Use standard labels from AI_TOOLS_OPTIONS directly
    const LOCALIZED_AI_TOOLS_OPTIONS = AI_TOOLS_OPTIONS

    const fetchProfile = useCallback(async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.push('/login')
            return
        }

        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (!profileData) {
            router.push('/onboarding')
            return
        }

        // Check if user is approved
        if (!profileData.is_approved) {
            router.push('/approval-pending')
            return
        }

        setProfile(profileData)
        setFormData({
            name: profileData.name,
            has_met: profileData.has_met,
            ai_tools: profileData.ai_tools || [],
            motivation: profileData.motivation || '',
        })
        setIsLoading(false)
    }, [router])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

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
        setSuccess(false)
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

        setIsSaving(true)

        try {
            const supabase = createClient()

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    has_met: formData.has_met,
                    ai_tools: formData.ai_tools,
                    motivation: formData.motivation,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profile!.id)

            if (updateError) throw updateError

            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch {
            setError('保存に失敗しました。もう一度お試しください。')
        } finally {
            setIsSaving(false)
        }
    }

    const handleLogout = async () => {
        setIsLoggingOut(true)

        try {
            const supabase = createClient()
            await supabase.auth.signOut()
            router.push('/login')
        } catch {
            setError('ログアウトに失敗しました。')
            setIsLoggingOut(false)
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
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-howl-header text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <img
                            src="/logo-member.png"
                            alt="HOWL"
                            className="h-10 w-auto"
                        />
                    </Link>

                    <nav className="flex items-center gap-6">
                        <Link href="/dashboard" className="opacity-80 hover:opacity-100 flex items-center gap-1">
                            <span>ホーム</span>
                        </Link>
                        <Link href="/profile" className="text-amber-200 border-b border-amber-400 flex items-center gap-1">
                            <span>プロフィール</span>
                        </Link>
                        <Link href="/chat" className="opacity-80 hover:opacity-100 flex items-center gap-1">
                            <span>チャット</span>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Decorative corner */}
            <div className="fixed top-16 left-0 w-16 h-64 bg-[#2D4A4A] opacity-20" />

            <main className="max-w-5xl mx-auto px-4 py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Panel - Avatar & Stats */}
                    <div className="lg:w-80 flex-shrink-0">
                        <div className="bg-white rounded-2xl p-6 shadow-sm text-center" style={{ border: '1px solid #E8E0D0' }}>
                            {/* Avatar */}
                            <div className="relative inline-block mb-4">
                                {profile?.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile.name}
                                        className="w-32 h-32 rounded-full border-4"
                                        style={{ borderColor: '#2D4A4A' }}
                                    />
                                ) : (
                                    <div
                                        className="w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-medium border-4"
                                        style={{ background: '#2D4A4A', borderColor: '#C9A227' }}
                                    >
                                        {profile?.name.charAt(0)}
                                    </div>
                                )}
                                <button
                                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#4A7C6F] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#3A6C5F] transition-colors"
                                >
                                    <span className="text-sm">編集</span>
                                </button>
                            </div>

                            <h2 className="text-xl font-bold text-[#2D2D2D] mb-1">
                                {profile?.name}
                            </h2>
                        </div>
                    </div>

                    {/* Right Panel - Form */}
                    <div className="flex-1">
                        <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: '1px solid #E8E0D0' }}>
                            <h1 className="text-2xl font-bold text-[#2D2D2D] mb-2">
                                プロフィール編集
                            </h1>
                            <p className="text-[#6B6B6B] mb-8">プロフィール情報を更新します。</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {success && (
                                    <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2">
                                        更新されました！
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                                        {error}
                                    </div>
                                )}

                                {/* Two columns */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-[#6B6B6B] mb-2 tracking-wide">
                                            名前
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8B7BB8] focus:border-[#8B7BB8] transition-all"
                                                style={{ borderColor: '#E8E0D0' }}
                                            />
                                        </div>
                                        {validationErrors.name && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                                        )}
                                    </div>

                                    {/* Has Met */}
                                    <div>
                                        <label className="block text-sm font-semibold text-[#6B6B6B] mb-2 tracking-wide">
                                            面識
                                        </label>
                                        <div className="flex gap-4 mt-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="has_met"
                                                    checked={formData.has_met === true}
                                                    onChange={() => setFormData(prev => ({ ...prev, has_met: true }))}
                                                    className="w-4 h-4 text-[#8B7BB8] focus:ring-[#8B7BB8]"
                                                />
                                                <span className="text-[#2D2D2D]">はい</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="has_met"
                                                    checked={formData.has_met === false}
                                                    onChange={() => setFormData(prev => ({ ...prev, has_met: false }))}
                                                    className="w-4 h-4 text-[#8B7BB8] focus:ring-[#8B7BB8]"
                                                />
                                                <span className="text-[#2D2D2D]">いいえ</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Tools */}
                                <div>
                                    <label className="block text-sm font-semibold text-[#6B6B6B] mb-2 tracking-wide">
                                        使用しているAIツール
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {LOCALIZED_AI_TOOLS_OPTIONS.map(option => (
                                            <label
                                                key={option.value}
                                                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                                                style={{
                                                    background: formData.ai_tools.includes(option.value) ? '#8B7BB8' : '#FAF7F0',
                                                    color: formData.ai_tools.includes(option.value) ? 'white' : '#2D2D2D',
                                                    border: formData.ai_tools.includes(option.value) ? '2px solid #8B7BB8' : '2px solid transparent'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.ai_tools.includes(option.value)}
                                                    onChange={() => handleAiToolChange(option.value)}
                                                    className="sr-only"
                                                />
                                                <span>{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {validationErrors.ai_tools && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.ai_tools}</p>
                                    )}
                                </div>

                                {/* Motivation */}
                                <div>
                                    <label className="block text-sm font-semibold text-[#6B6B6B] mb-2 tracking-wide">
                                        意気込み
                                    </label>
                                    <textarea
                                        value={formData.motivation}
                                        onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
                                        rows={4}
                                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8B7BB8] focus:border-[#8B7BB8] transition-all resize-none"
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

                                {/* Buttons */}
                                <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: '#E8E0D0' }}>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="px-6 py-3 border-2 rounded-xl font-medium transition-all hover:bg-[#FAF7F0] flex items-center gap-2"
                                        style={{ borderColor: '#E8E0D0' }}
                                    >
                                        <span>→</span> ログアウト
                                    </button>

                                    <div className="flex-1" />

                                    <button
                                        type="button"
                                        onClick={() => fetchProfile()}
                                        className="px-6 py-3 text-[#6B6B6B] hover:text-[#2D2D2D]"
                                    >
                                        キャンセル
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2 disabled:opacity-50"
                                        style={{ background: 'linear-gradient(135deg, #4A7C6F 0%, #3A5C5C 100%)' }}
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                保存中...
                                            </>
                                        ) : (
                                            <>
                                                保存
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
