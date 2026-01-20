'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Chat } from '@/types/database'
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js'



export default function ChatPage() {
    const router = useRouter()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [messages, setMessages] = useState<Chat[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [sendError, setSendError] = useState<string | null>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchData = useCallback(async () => {
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

        const { data: messagesData } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })

        if (messagesData) {
            setMessages(messagesData)
        }

        setIsLoading(false)
    }, [router])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        if (!profile) return

        const supabase = createClient()

        const channel = supabase
            .channel('chat-updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chats',
                    filter: `user_id=eq.${profile.user_id}`,
                },
                (payload: RealtimePostgresInsertPayload<Chat>) => {
                    setMessages(prev => [...prev, payload.new])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [profile])

    const handleSend = async () => {
        if (!newMessage.trim() || !profile) return

        setSendError(null)
        setIsSending(true)

        try {
            const supabase = createClient()

            const { error } = await supabase.from('chats').insert({
                user_id: profile.user_id,
                sender_type: 'user',
                message: newMessage.trim(),
            })

            if (error) throw error

            setNewMessage('')
        } catch {
            setSendError('送信に失敗しました。タップして再試行してください。')
        } finally {
            setIsSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
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
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-howl-header text-white shadow-lg">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
                    <Link href="/dashboard" className="text-2xl hover:scale-110 transition-transform">
                        ←
                    </Link>
                    <div className="flex-1 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-xl font-bold">
                            C
                        </div>
                        <div>
                            <h1 className="font-semibold tracking-wider">
                                チャット
                            </h1>
                            <p className="text-xs opacity-60">北さんとのメッセージ</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-3xl mx-auto space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-20">
                            <h2 className="text-xl font-semibold text-[#2D4A4A] mb-2">
                                メッセージ履歴がありません
                            </h2>
                            <p className="text-[#8B7355]">
                                メッセージを送信できます。
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex items-end gap-2 max-w-[80%] ${msg.sender_type === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {/* Avatar */}
                                    {msg.sender_type === 'admin' && (
                                        <div className="w-8 h-8 rounded-full bg-[#2D4A4A] flex items-center justify-center text-white text-sm flex-shrink-0">
                                            A
                                        </div>
                                    )}

                                    {/* Message Bubble */}
                                    <div
                                        className={`px-4 py-3 rounded-2xl ${msg.sender_type === 'user'
                                            ? 'rounded-br-sm'
                                            : 'rounded-bl-sm'
                                            }`}
                                        style={{
                                            background: msg.sender_type === 'user'
                                                ? 'linear-gradient(135deg, #8B7BB8 0%, #6B5A9E 100%)'
                                                : 'white',
                                            color: msg.sender_type === 'user' ? 'white' : '#2D2D2D',
                                            border: msg.sender_type === 'admin' ? '1px solid #E8E0D0' : 'none',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                        }}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.message}</p>
                                        <p
                                            className={`text-xs mt-1 ${msg.sender_type === 'user' ? 'text-white/60' : 'text-[#8B7355]'
                                                }`}
                                        >
                                            {new Date(msg.created_at).toLocaleTimeString('ja-JP', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Error Toast */}
            {sendError && (
                <div className="px-4 py-2">
                    <div
                        className="max-w-3xl mx-auto p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between"
                        onClick={() => { setSendError(null); handleSend() }}
                    >
                        <span>{sendError}</span>
                        <button className="text-red-600 underline">再試行</button>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <footer className="p-4" style={{ background: 'rgba(255,255,255,0.9)', borderTop: '1px solid #E8E0D0' }}>
                <div className="max-w-3xl mx-auto flex items-end gap-3">
                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="メッセージを書く..."
                            rows={1}
                            className="w-full px-4 py-3 pr-12 border-2 rounded-2xl resize-none focus:ring-2 focus:ring-[#8B7BB8] focus:border-[#8B7BB8] transition-all"
                            style={{
                                borderColor: '#E8E0D0',
                                maxHeight: '120px',
                                minHeight: '48px'
                            }}
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || isSending}
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white disabled:opacity-50 transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #8B7BB8 0%, #6B5A9E 100%)' }}
                    >
                        {isSending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <span className="text-xl">→</span>
                        )}
                    </button>
                </div>

                <p className="text-center text-xs text-[#8B7355] mt-2">
                    メッセージはリアルタイムで送信されます
                </p>
            </footer>
        </div>
    )
}
