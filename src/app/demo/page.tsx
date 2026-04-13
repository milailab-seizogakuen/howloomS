"use client"

// Simple demo page to test Loom player - no auth required
export default function LoomDemoPage() {
    // Sample Loom video ID - you can replace this with any Loom video ID
    const sampleLoomId = "679eefb452f640c3af83e25ce36a695a"

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    🎬 Loom Player デモ
                </h1>

                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                        Loom 埋め込みテスト
                    </h2>

                    {/* Loom Player */}
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-900 mb-4">
                        <iframe
                            src={`https://www.loom.com/embed/${sampleLoomId}`}
                            title="Loom video player"
                            allowFullScreen
                            className="w-full h-full"
                        />
                    </div>

                    <p className="text-sm text-gray-500">
                        Video ID: <code className="bg-gray-100 px-2 py-1 rounded">{sampleLoomId}</code>
                    </p>
                </div>

                {/* Input for testing different Loom IDs */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                        別のLoom動画をテスト
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Loom URLまたはIDを下に貼り付けて、Enterを押してください：
                    </p>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            const input = (e.target as HTMLFormElement).elements.namedItem('loomUrl') as HTMLInputElement
                            const value = input.value.trim()

                            // Extract Loom ID from URL or use as-is
                            const match = value.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/)
                            const id = match ? match[1] : value

                            if (id) {
                                window.location.href = `/demo?id=${id}`
                            }
                        }}
                    >
                        <input
                            type="text"
                            name="loomUrl"
                            placeholder="https://www.loom.com/share/xxxxx または Loom ID"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="submit"
                            className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            再生する
                        </button>
                    </form>
                </div>

                <p className="text-center text-gray-400 mt-8 text-sm">
                    このページは認証不要のデモページです
                </p>
            </div>
        </div>
    )
}
