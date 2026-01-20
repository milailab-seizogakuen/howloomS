'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { gradeQuiz } from '@/lib/utils'
import type { Quiz, QuizQuestion } from '@/types/database'

interface QuizClientProps {
    courseId: string
    quizId: string
}

type QuizState = 'loading' | 'quiz' | 'result'



export default function QuizClient({ courseId, quizId }: QuizClientProps) {
    const router = useRouter()
    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [quizState, setQuizState] = useState<QuizState>('loading')
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<number[][]>([])
    const [result, setResult] = useState<{
        score: number
        totalQuestions: number
        percentage: number
        passed: boolean
    } | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchQuiz = useCallback(async () => {
        const supabase = createClient()

        // Check authentication and approval
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

        const { data: profileData } = await supabase
            .from('profiles')
            .select('is_approved')
            .eq('user_id', user.id)
            .single()

        if (!profileData?.is_approved) {
            router.push('/approval-pending')
            return
        }

        const { data: quizData } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', quizId)
            .single()

        if (quizData) {
            setQuiz(quizData)
            setAnswers(new Array(quizData.questions.length).fill([]))
            setQuizState('quiz')
        }
    }, [quizId, router])

    useEffect(() => {
        fetchQuiz()
    }, [fetchQuiz])

    const handleAnswerSelect = (questionIndex: number, optionIndex: number, isMultiple: boolean) => {
        setAnswers(prev => {
            const newAnswers = [...prev]
            if (isMultiple) {
                const currentAnswers = newAnswers[questionIndex] || []
                if (currentAnswers.includes(optionIndex)) {
                    newAnswers[questionIndex] = currentAnswers.filter(a => a !== optionIndex)
                } else {
                    newAnswers[questionIndex] = [...currentAnswers, optionIndex]
                }
            } else {
                newAnswers[questionIndex] = [optionIndex]
            }
            return newAnswers
        })
    }

    const handleSubmit = async () => {
        if (!quiz) return
        setIsSubmitting(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const correctAnswers = quiz.questions.map(q => q.correct_answers)
            const gradeResult = gradeQuiz(answers, correctAnswers)
            const passed = gradeResult.percentage >= quiz.passing_score

            await supabase.from('quiz_results').insert({
                user_id: user.id,
                quiz_id: quiz.id,
                score: gradeResult.percentage,
                passed,
                answers,
            })

            setResult({ ...gradeResult, passed })
            setQuizState('result')
        } catch (error) {
            console.error('Failed to submit quiz:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRetry = () => {
        setAnswers(new Array(quiz?.questions.length || 0).fill([]))
        setCurrentQuestionIndex(0)
        setResult(null)
        setQuizState('quiz')
    }

    if (quizState === 'loading') {
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

    if (!quiz) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[#2D2D2D]">
                        データが見つかりません
                    </h1>
                    <Link href={`/courses/${courseId}`} className="mt-4 text-[#8B7BB8] hover:underline block">
                        講座に戻る →
                    </Link>
                </div>
            </div>
        )
    }

    // Result Screen
    if (quizState === 'result' && result) {
        return (
            <div className="min-h-screen py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Result Card */}
                    <div
                        className="bg-white rounded-3xl p-8 shadow-xl text-center mb-8"
                        style={{ border: '3px solid #C9A227' }}
                    >
                        <h1
                            className="text-4xl font-bold mb-2"
                            style={{
                                color: result.passed ? '#4A7C6F' : '#8B7355'
                            }}
                        >
                            {result.passed ? '合格！' : '不合格'}
                        </h1>
                        <p className="text-[#6B6B6B] mb-6">
                            正解数: {result.score} / {result.totalQuestions} ({result.percentage}%)
                        </p>

                        {/* Progress Ring */}
                        <div className="w-32 h-32 mx-auto mb-6 relative">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    fill="none"
                                    stroke="#E8E0D0"
                                    strokeWidth="12"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    fill="none"
                                    stroke={result.passed ? '#4A7C6F' : '#DC2626'}
                                    strokeWidth="12"
                                    strokeDasharray={`${(result.percentage / 100) * 352} 352`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-[#2D2D2D]">{result.percentage}%</span>
                            </div>
                        </div>

                        <p className="text-sm text-[#8B7355] mb-6">
                            合格ライン: {quiz.passing_score}%
                        </p>

                        <div className="flex gap-4 justify-center">
                            {!result.passed && (
                                <button
                                    onClick={handleRetry}
                                    className="px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #8B7BB8 0%, #6B5A9E 100%)' }}
                                >
                                    再挑戦する
                                </button>
                            )}
                            <Link
                                href={`/courses/${courseId}`}
                                className="px-8 py-3 bg-[#E8E0D0] hover:bg-[#D4C8B8] text-[#2D2D2D] rounded-xl font-semibold transition-colors"
                            >
                                講座に戻る
                            </Link>
                        </div>
                    </div>

                    {/* Answer Review */}
                    <h2 className="text-xl font-semibold text-[#2D4A4A] mb-4">
                        振り返り
                    </h2>
                    <div className="space-y-4">
                        {quiz.questions.map((question, qIndex) => {
                            const userAnswer = answers[qIndex] || []
                            const isCorrect =
                                userAnswer.length === question.correct_answers.length &&
                                userAnswer.every(a => question.correct_answers.includes(a))

                            return (
                                <div
                                    key={question.id}
                                    className="bg-white rounded-xl p-6 shadow-sm"
                                    style={{
                                        border: `2px solid ${isCorrect ? '#4A7C6F' : '#DC2626'}`
                                    }}
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <span className={`text-xl font-bold ${isCorrect ? 'text-[#4A7C6F]' : 'text-[#DC2626]'}`}>
                                            {isCorrect ? '正解' : '不正解'}
                                        </span>
                                        <p className="font-medium text-[#2D2D2D]">
                                            Q{qIndex + 1}. {question.text}
                                        </p>
                                    </div>

                                    <div className="space-y-2 ml-10">
                                        {question.options.map((option, oIndex) => {
                                            const isUserSelected = userAnswer.includes(oIndex)
                                            const isCorrectOption = question.correct_answers.includes(oIndex)

                                            return (
                                                <div
                                                    key={oIndex}
                                                    className="p-3 rounded-lg text-sm"
                                                    style={{
                                                        background: isCorrectOption
                                                            ? 'rgba(74, 124, 111, 0.1)'
                                                            : isUserSelected
                                                                ? 'rgba(220, 38, 38, 0.1)'
                                                                : '#F5F0E6'
                                                    }}
                                                >
                                                    {option}
                                                    {isCorrectOption && <span className="ml-2 text-[#4A7C6F]">(正解)</span>}
                                                    {isUserSelected && !isCorrectOption && <span className="ml-2 text-red-600">(あなたの回答)</span>}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {question.explanation && (
                                        <div className="mt-4 ml-10 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                            <p className="text-sm text-amber-800">
                                                <strong>解説:</strong> {question.explanation}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    // Quiz Taking State
    const currentQuestion = quiz.questions[currentQuestionIndex] as QuizQuestion
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
    const hasAnswered = answers[currentQuestionIndex]?.length > 0

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header
                className="py-4 px-6 flex items-center justify-between text-white"
                style={{ background: 'linear-gradient(135deg, #C9A227 0%, #8B7355 100%)' }}
            >
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-wider">
                            テスト
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span
                        className="px-4 py-2 bg-white/20 rounded-lg"
                    >
                        問題 {currentQuestionIndex + 1}/{quiz.questions.length}
                    </span>
                    <Link href={`/courses/${courseId}`} className="text-2xl hover:scale-110 transition-transform">
                        ×
                    </Link>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="h-1 bg-[#E8E0D0]">
                <div
                    className="h-full transition-all duration-300"
                    style={{
                        width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
                        background: 'linear-gradient(90deg, #4A7C6F 0%, #8B7BB8 100%)'
                    }}
                />
            </div>

            {/* Question Area */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div
                    className="w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl"
                    style={{ border: '3px solid #C9A227' }}
                >
                    {/* Category */}
                    <div className="text-center mb-6">
                        <span className="px-4 py-1 bg-[#E8E0D0] rounded-full text-sm text-[#8B7355]">
                            テスト
                        </span>
                    </div>

                    {/* Question */}
                    <h2 className="text-xl lg:text-2xl font-bold text-center text-[#2D2D2D] mb-8">
                        {currentQuestion.text}
                    </h2>

                    {currentQuestion.type === 'multiple' && (
                        <p className="text-center text-sm text-[#8B7355] mb-4">
                            ※ 複数選択可
                        </p>
                    )}

                    {/* Options */}
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = answers[currentQuestionIndex]?.includes(index)

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(currentQuestionIndex, index, currentQuestion.type === 'multiple')}
                                    className="w-full p-4 text-left rounded-xl transition-all duration-300 flex items-center gap-4"
                                    style={{
                                        background: isSelected
                                            ? 'linear-gradient(135deg, #8B7BB8 0%, #6B5A9E 100%)'
                                            : 'white',
                                        color: isSelected ? 'white' : '#2D2D2D',
                                        border: isSelected ? '2px solid #8B7BB8' : '2px solid #E8E0D0',
                                        boxShadow: isSelected ? '0 4px 12px rgba(139,123,184,0.3)' : 'none'
                                    }}
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                                        style={{
                                            background: isSelected ? 'rgba(255,255,255,0.2)' : '#8B7BB8',
                                            color: 'white'
                                        }}
                                    >
                                        {index + 1}
                                    </div>
                                    <span className="flex-1">{option}</span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8">
                        {currentQuestionIndex > 0 ? (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                className="px-6 py-3 text-[#8B7355] hover:text-[#2D2D2D] font-medium flex items-center gap-2"
                            >
                                ← 前へ
                            </button>
                        ) : (
                            <div />
                        )}

                        {isLastQuestion ? (
                            <button
                                onClick={handleSubmit}
                                disabled={!hasAnswered || isSubmitting}
                                className="px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2 disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #8B7BB8 0%, #6B5A9E 100%)' }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        判定中...
                                    </>
                                ) : (
                                    <>
                                        回答を確定
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                disabled={!hasAnswered}
                                className="px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #8B7BB8 0%, #6B5A9E 100%)' }}
                            >
                                次へ →
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
