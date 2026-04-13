'use client'

import { useState, useEffect } from 'react'
import { getTypeTags, getThemeTags } from '@/lib/api'
import TagBadge from './TagBadge'

interface TagFilterProps {
    onFilterChange: (filters: {
        typeTag?: string
        themeTags: string[]
        mode: 'AND' | 'OR'
    }) => void
    initialFilters?: {
        typeTag?: string
        themeTags: string[]
        mode: 'AND' | 'OR'
    }
}

interface Tag {
    id: string
    name: string
    color_code: string
    display_order: number
}

export default function TagFilter({ onFilterChange, initialFilters }: TagFilterProps) {
    const [typeTags, setTypeTags] = useState<Tag[]>([])
    const [themeTags, setThemeTags] = useState<Tag[]>([])
    const [selectedTypeTag, setSelectedTypeTag] = useState<string>(initialFilters?.typeTag || '')
    const [selectedThemeTags, setSelectedThemeTags] = useState<string[]>(initialFilters?.themeTags || [])
    const [filterMode, setFilterMode] = useState<'AND' | 'OR'>(initialFilters?.mode || 'AND')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadTags()
    }, [])

    // Sync with initialFilters when they change
    useEffect(() => {
        if (initialFilters) {
            setSelectedTypeTag(initialFilters.typeTag || '')
            setSelectedThemeTags(initialFilters.themeTags || [])
            setFilterMode(initialFilters.mode || 'AND')
        }
    }, [initialFilters])

    async function loadTags() {
        try {
            setLoading(true)
            const [types, themes] = await Promise.all([
                getTypeTags(),
                getThemeTags(),
            ])
            setTypeTags(types as Tag[])
            setThemeTags(themes as Tag[])
        } catch (error) {
            console.error('Failed to load tags:', error)
        } finally {
            setLoading(false)
        }
    }

    function handleTypeTagChange(tagId: string) {
        setSelectedTypeTag(tagId)
        notifyFilterChange(tagId, selectedThemeTags, filterMode)
    }

    function handleThemeTagToggle(tagId: string) {
        const newThemeTags = selectedThemeTags.includes(tagId)
            ? selectedThemeTags.filter(id => id !== tagId)
            : [...selectedThemeTags, tagId]

        setSelectedThemeTags(newThemeTags)
        notifyFilterChange(selectedTypeTag, newThemeTags, filterMode)
    }

    function handleFilterModeChange(mode: 'AND' | 'OR') {
        setFilterMode(mode)
        notifyFilterChange(selectedTypeTag, selectedThemeTags, mode)
    }

    function notifyFilterChange(
        typeTag: string,
        themeTags: string[],
        mode: 'AND' | 'OR'
    ) {
        onFilterChange({
            typeTag: typeTag || undefined,
            themeTags,
            mode,
        })
    }

    function handleReset() {
        setSelectedTypeTag('')
        setSelectedThemeTags([])
        setFilterMode('AND')
        onFilterChange({ themeTags: [], mode: 'AND' })
    }

    if (loading) {
        return <div className="text-center py-4 text-[#8B7355]">タグを読み込み中...</div>
    }

    return (
        <div className="bg-white rounded-2xl border border-[#E8E0D0] p-6 space-y-6 sticky top-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2D4A4A]">タグでフィルタ</h2>

            {/* 講座タイプ */}
            <div>
                <h3 className="text-sm font-semibold text-[#8B7355] mb-3">講座タイプ</h3>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="type_tag"
                            value=""
                            checked={selectedTypeTag === ''}
                            onChange={() => handleTypeTagChange('')}
                            className="w-4 h-4 text-[#4A7C6F] focus:ring-[#4A7C6F]"
                        />
                        <span className="text-sm text-[#2D4A4A]">すべて</span>
                    </label>

                    {typeTags.map(tag => (
                        <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type_tag"
                                value={tag.id}
                                checked={selectedTypeTag === tag.id}
                                onChange={() => handleTypeTagChange(tag.id)}
                                className="w-4 h-4 text-[#4A7C6F] focus:ring-[#4A7C6F]"
                            />
                            <TagBadge tag={tag} />
                        </label>
                    ))}
                </div>
            </div>

            {/* テーマタグ */}
            <div>
                <h3 className="text-sm font-semibold text-[#8B7355] mb-3">テーマ</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {themeTags.map(tag => (
                        <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedThemeTags.includes(tag.id)}
                                onChange={() => handleThemeTagToggle(tag.id)}
                                className="w-4 h-4 text-[#4A7C6F] focus:ring-[#4A7C6F] rounded"
                            />
                            <TagBadge tag={tag} />
                        </label>
                    ))}
                </div>

                {/* AND/OR モード選択 */}
                {selectedThemeTags.length > 1 && (
                    <div className="bg-[#FAF7F0] p-3 rounded-lg text-sm space-y-2 border border-[#E8E0D0]">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="filter_mode"
                                value="AND"
                                checked={filterMode === 'AND'}
                                onChange={() => handleFilterModeChange('AND')}
                                className="w-4 h-4 text-[#4A7C6F] focus:ring-[#4A7C6F]"
                            />
                            <span className="text-[#2D4A4A]">
                                <strong>AND</strong>：指定したテーマ<strong>すべて</strong>を含む
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="filter_mode"
                                value="OR"
                                checked={filterMode === 'OR'}
                                onChange={() => handleFilterModeChange('OR')}
                                className="w-4 h-4 text-[#4A7C6F] focus:ring-[#4A7C6F]"
                            />
                            <span className="text-[#2D4A4A]">
                                <strong>OR</strong>：指定したテーマ<strong>いずれか</strong>を含む
                            </span>
                        </label>
                    </div>
                )}
            </div>

            {/* リセットボタン */}
            {(selectedTypeTag || selectedThemeTags.length > 0) && (
                <button
                    onClick={handleReset}
                    className="w-full bg-[#E8E0D0] text-[#8B7355] px-4 py-2 rounded-lg font-medium hover:bg-[#D4C8B8] transition"
                >
                    フィルタをリセット
                </button>
            )}
        </div>
    )
}
