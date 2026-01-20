import CourseDetailClient from './CourseDetailClient'

interface CoursePageProps {
    params: Promise<{
        id: string
    }>
}

export default async function CoursePage({ params }: CoursePageProps) {
    const { id } = await params
    return <CourseDetailClient courseId={id} />
}
