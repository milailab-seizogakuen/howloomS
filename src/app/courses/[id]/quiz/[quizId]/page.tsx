import QuizClient from './QuizClient'

interface QuizPageProps {
    params: Promise<{
        id: string
        quizId: string
    }>
}

export default async function QuizPage({ params }: QuizPageProps) {
    const { id, quizId } = await params
    return <QuizClient courseId={id} quizId={quizId} />
}
