// Database types for Howl Learning Platform

export interface Profile {
    id: string
    user_id: string
    name: string
    avatar_url: string | null
    has_met: boolean
    ai_tools: string[]
    motivation: string | null
    is_admin: boolean
    is_approved: boolean
    created_at: string
    updated_at: string
}

export interface Course {
    id: string
    title: string
    description: string | null
    date: string | null
    duration_minutes: number | null
    sort_order: number
    created_at: string
    updated_at: string
}

export interface Video {
    id: string
    course_id: string
    title: string
    youtube_url: string
    video_id: string
    type: 'main' | 'supplementary'
    sort_order: number
    created_at: string
}

export interface QuizQuestion {
    id: number
    text: string
    type: 'single' | 'multiple'
    options: string[]
    correct_answers: number[]
    explanation: string
}

export interface Quiz {
    id: string
    course_id: string
    video_id: string | null
    title: string
    questions: QuizQuestion[]
    passing_score: number
    created_at: string
}

export interface QuizResult {
    id: string
    user_id: string
    quiz_id: string
    score: number
    passed: boolean
    answers: number[][]
    completed_at: string
}

export interface VideoProgress {
    id: string
    user_id: string
    video_id: string
    is_completed: boolean
    completed_at: string | null
}

export interface Chat {
    id: string
    user_id: string
    message: string
    sender_type: 'user' | 'admin'
    created_at: string
}

// Extended types with relations
export interface CourseWithProgress extends Course {
    videos: VideoWithProgress[]
    quizzes: QuizWithResult[]
    progress_percentage: number
}

export interface VideoWithProgress extends Video {
    progress: VideoProgress | null
}

export interface QuizWithResult extends Quiz {
    result: QuizResult | null
}
