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
    /**
     * NOTE:
     * Migration 005 で `youtube_url` は `video_url` にリネームされています（実体はLoom URL）。
     * 既存コード互換のため、両方を許容します。
     */
    video_url?: string
    youtube_url?: string
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

export interface Tag {
    id: string
    name: string
    category: 'type' | 'theme'
    color_code: string
    display_order: number
}

export interface VideoTag {
    tag_id: string
    tags: Tag
}

export interface VideoWithTags extends Video {
    video_tags?: VideoTag[]
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
