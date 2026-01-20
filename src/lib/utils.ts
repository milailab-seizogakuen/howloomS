/**
 * Extract YouTube video ID from various URL formats
 */
export function extractVideoId(url: string): string | null {
    const patterns = [
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
        /youtu\.be\/([a-zA-Z0-9_-]+)/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    ]

    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) return match[1]
    }

    return null
}

/**
 * Calculate course progress percentage
 * Formula: (completed videos / total videos) * 0.5 + (passed quizzes / total quizzes) * 0.5
 */
export function calculateProgress(
    completedVideos: number,
    totalVideos: number,
    passedQuizzes: number,
    totalQuizzes: number
): number {
    if (totalVideos === 0 && totalQuizzes === 0) return 0

    const videoProgress = totalVideos > 0 ? (completedVideos / totalVideos) * 0.5 : 0.5
    const quizProgress = totalQuizzes > 0 ? (passedQuizzes / totalQuizzes) * 0.5 : 0.5

    // If no videos, quiz counts for 100%
    if (totalVideos === 0) {
        return Math.floor((passedQuizzes / totalQuizzes) * 100)
    }

    // If no quizzes, videos count for 100%
    if (totalQuizzes === 0) {
        return Math.floor((completedVideos / totalVideos) * 100)
    }

    return Math.floor((videoProgress + quizProgress) * 100)
}

/**
 * Grade a quiz and calculate score
 */
export function gradeQuiz(
    userAnswers: number[][],
    correctAnswers: number[][]
): { score: number; totalQuestions: number; percentage: number } {
    let correctCount = 0
    const totalQuestions = correctAnswers.length

    userAnswers.forEach((answer, index) => {
        if (index < correctAnswers.length) {
            const correct = correctAnswers[index]
            // Check if arrays are equal
            if (
                answer.length === correct.length &&
                answer.every(val => correct.includes(val)) &&
                correct.every(val => answer.includes(val))
            ) {
                correctCount++
            }
        }
    })

    const percentage = totalQuestions > 0
        ? Math.floor((correctCount / totalQuestions) * 100)
        : 0

    return {
        score: correctCount,
        totalQuestions,
        percentage,
    }
}
