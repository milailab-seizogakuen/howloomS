import { z } from 'zod'

export const profileSchema = z.object({
    name: z
        .string()
        .min(1, '名前は1文字以上で入力してください')
        .max(50, '名前は50文字以内で入力してください'),
    has_met: z.boolean(),
    ai_tools: z
        .array(z.string())
        .min(1, '1つ以上選択してください'),
    motivation: z
        .string()
        .min(1, '意気込みを入力してください')
        .max(200, '意気込みは200文字以内で入力してください'),
})

export type ProfileFormData = z.infer<typeof profileSchema>

export const AI_TOOLS_OPTIONS = [
    { value: 'chatgpt', label: 'ChatGPT' },
    { value: 'claude', label: 'Claude' },
    { value: 'gemini', label: 'Gemini' },
    { value: 'midjourney', label: 'Midjourney' },
    { value: 'other', label: 'その他' },
    { value: 'none', label: '使っていない' },
] as const
