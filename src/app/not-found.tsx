import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    ページが見つかりません
                </h2>
                <p className="text-gray-600 mb-8">
                    お探しのページは存在しないか、移動した可能性があります。
                </p>
                <Link
                    href="/dashboard"
                    className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
                >
                    ダッシュボードに戻る
                </Link>
            </div>
        </div>
    )
}
