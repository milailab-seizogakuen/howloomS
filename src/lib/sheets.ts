/**
 * src/lib/sheets.ts
 * Google Sheets データアクセス層
 *
 * スプレッドシートは2つに分割:
 *   GOOGLE_SHEETS_USERS_SPREADSHEET_ID   → ユーザー認証・プロフィール情報
 *   GOOGLE_SHEETS_COURSES_SPREADSHEET_ID → 講座・学習データ
 */
import { google } from 'googleapis'
import type { Profile, Course, Video, Tag, VideoWithTags, VideoTag, Quiz, QuizResult, VideoProgress, Chat } from '@/types/database'

// ─── 認証 ────────────────────────────────────────────────────────────────────

function getAuth() {
    const scopes = ['https://www.googleapis.com/auth/spreadsheets']

    // パターン1: サービスアカウント JSON ファイルパスが指定されている場合（推奨）
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        return new google.auth.GoogleAuth({ keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, scopes })
    }

    // パターン2: 環境変数で直接指定する場合
    // Private Key の \\n はいくつかの形式で渡されうるため全パターン対応
    const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? ''
    // "\\\\n" → "\\n" → "\n" の順で試みる
    const privateKey = rawKey
        .replace(/\\\\n/g, '\n')   // 4重バックスラッシュ → 改行
        .replace(/\\n/g, '\n')     // 2重バックスラッシュ → 改行

    return new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
            private_key: privateKey,
        },
        scopes,
    })
}

// ─── スプレッドシートID ────────────────────────────────────────────────────────

/** ユーザー認証・プロフィール情報スプレッドシート */
const USERS_SS = () => process.env.GOOGLE_SHEETS_USERS_SPREADSHEET_ID!
/** 講座・学習データスプレッドシート */
const COURSES_SS = () => process.env.GOOGLE_SHEETS_COURSES_SPREADSHEET_ID!

// ─── 低レベルヘルパー ──────────────────────────────────────────────────────────

async function readRange(spreadsheetId: string, range: string): Promise<string[][]> {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() })
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range })
    return (res.data.values ?? []) as string[][]
}

async function appendRows(spreadsheetId: string, sheetName: string, rows: string[][]): Promise<void> {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() })
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: rows },
    })
}

async function updateRow(spreadsheetId: string, sheetName: string, rowIndex: number, headers: string[], data: Record<string, unknown>): Promise<void> {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() })
    const values = headers.map(h => {
        const v = data[h]
        if (v === null || v === undefined) return ''
        if (typeof v === 'object') return JSON.stringify(v)
        return String(v)
    })
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [values] },
    })
}


// ─── パーサー ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Parsers = Partial<Record<string, (v: string) => any>>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRows<T = Record<string, any>>(
    values: string[][],
    parsers: Parsers = {}
): Array<T & { _rowIndex: number }> {
    if (!values || values.length < 2) return []
    const headers = values[0]
    return values.slice(1).map((row, i) => {
        const obj: Record<string, unknown> = { _rowIndex: i + 2 }
        headers.forEach((h, j) => {
            const raw = row[j] ?? ''
            obj[h] = parsers[h] ? parsers[h]!(raw) : (raw === '' ? null : raw)
        })
        return obj as T & { _rowIndex: number }
    })
}

const bool = (v: string) => v === 'true' || v === 'TRUE' || v === '1'
const num = (v: string) => v === '' ? null : Number(v)
const json = (v: string) => { try { return v ? JSON.parse(v) : null } catch { return null } }
const jsonArr = (v: string) => { try { return v ? JSON.parse(v) : [] } catch { return [] } }

function objToRow(headers: string[], data: Record<string, unknown>): string[] {
    return headers.map(h => {
        const v = data[h]
        if (v === null || v === undefined) return ''
        if (Array.isArray(v) || (typeof v === 'object' && v !== null)) return JSON.stringify(v)
        return String(v)
    })
}

// ─── Profiles (ユーザー認証スプレッドシート) ──────────────────────────────────────

const PROFILE_PARSERS: Parsers = {
    has_met: bool, is_admin: bool, is_approved: bool, ai_tools: jsonArr,
}

type ProfileRow = Profile & { _rowIndex: number; hashed_password: string | null; email: string;[key: string]: unknown }

async function readProfileRows(): Promise<ProfileRow[]> {
    return parseRows<ProfileRow>(await readRange(USERS_SS(), 'profiles!A1:Z'), PROFILE_PARSERS)
}

export async function getProfileByEmail(email: string): Promise<ProfileRow | null> {
    const rows = await readProfileRows()
    return rows.find(r => r.email === email) ?? null
}

export async function insertProfile(data: Record<string, unknown>): Promise<void> {
    const values = await readRange(USERS_SS(), 'profiles!A1:Z')
    if (!values?.length) return
    const now = new Date().toISOString()
    const row = objToRow(values[0], { ...data, created_at: now, updated_at: now })
    await appendRows(USERS_SS(), 'profiles', [row])
}

export async function updateProfile(email: string, data: Partial<Profile>): Promise<void> {
    const values = await readRange(USERS_SS(), 'profiles!A1:Z')
    if (!values?.length) return
    const headers = values[0]
    const rows = await readProfileRows()
    const row = rows.find(r => r.email === email)
    if (!row) return
    await updateRow(USERS_SS(), 'profiles', row._rowIndex, headers, {
        ...row, ...data, updated_at: new Date().toISOString()
    })
}

// ─── Courses (講座スプレッドシート) ──────────────────────────────────────────────

const COURSE_PARSERS: Parsers = { sort_order: num, duration_minutes: num }

export async function getCourses(): Promise<Course[]> {
    return parseRows<Course>(await readRange(COURSES_SS(), 'courses!A1:Z'), COURSE_PARSERS)
}

export async function getCourseById(id: string): Promise<Course | null> {
    return (await getCourses()).find(c => c.id === id) ?? null
}

// ─── Videos ──────────────────────────────────────────────────────────────────

const VIDEO_PARSERS: Parsers = { sort_order: num }

export async function getVideos(): Promise<Video[]> {
    return parseRows<Video>(await readRange(COURSES_SS(), 'videos!A1:Z'), VIDEO_PARSERS)
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function getTags(): Promise<Tag[]> {
    return parseRows<Tag>(await readRange(COURSES_SS(), 'tags!A1:Z'), { display_order: num })
}

// ─── Videos with Tags ────────────────────────────────────────────────────────

export async function getVideosWithTags(): Promise<VideoWithTags[]> {
    const [videos, tags, vtRows] = await Promise.all([
        getVideos(),
        getTags(),
        parseRows<{ video_id: string; tag_id: string }>(await readRange(COURSES_SS(), 'video_tags!A1:Z')),
    ])
    const tagsById = Object.fromEntries(tags.map(t => [t.id, t]))
    return videos.map(v => ({
        ...v,
        video_tags: vtRows
            .filter(vt => vt.video_id === v.id)
            .map(vt => ({ tag_id: vt.tag_id, tags: tagsById[vt.tag_id] } as VideoTag))
            .filter(vt => vt.tags),
    }))
}

// ─── Quizzes ─────────────────────────────────────────────────────────────────

const QUIZ_PARSERS: Parsers = { questions: json, passing_score: num }

export async function getQuizzesByCourseId(courseId: string): Promise<Quiz[]> {
    return parseRows<Quiz>(await readRange(COURSES_SS(), 'quizzes!A1:Z'), QUIZ_PARSERS)
        .filter(q => q.course_id === courseId)
}

export async function getAllQuizzes(): Promise<Quiz[]> {
    return parseRows<Quiz>(await readRange(COURSES_SS(), 'quizzes!A1:Z'), QUIZ_PARSERS)
}

export async function getQuizById(id: string): Promise<Quiz | null> {
    return (await getAllQuizzes()).find(q => q.id === id) ?? null
}

// ─── Quiz Results ─────────────────────────────────────────────────────────────

const QR_PARSERS: Parsers = { score: num, passed: bool, answers: json }

export async function getQuizResultsByUserId(userId: string): Promise<QuizResult[]> {
    return parseRows<QuizResult>(await readRange(COURSES_SS(), 'quiz_results!A1:Z'), QR_PARSERS)
        .filter(r => r.user_id === userId)
}

export async function insertQuizResult(data: Omit<QuizResult, 'id' | 'completed_at'>): Promise<void> {
    const values = await readRange(COURSES_SS(), 'quiz_results!A1:Z')
    if (!values?.length) return
    const row = objToRow(values[0], {
        ...data, id: crypto.randomUUID(), completed_at: new Date().toISOString()
    })
    await appendRows(COURSES_SS(), 'quiz_results', [row])
}

// ─── Video Progress ───────────────────────────────────────────────────────────

const PROGRESS_PARSERS: Parsers = { is_completed: bool }

export async function getVideoProgressByUserId(userId: string): Promise<VideoProgress[]> {
    return parseRows<VideoProgress>(await readRange(COURSES_SS(), 'video_progress!A1:Z'), PROGRESS_PARSERS)
        .filter(p => p.user_id === userId)
}

export async function upsertVideoProgress(userId: string, videoId: string, isCompleted: boolean): Promise<void> {
    const values = await readRange(COURSES_SS(), 'video_progress!A1:Z')
    if (!values?.length) return
    const headers = values[0]
    const rows = parseRows<VideoProgress & { _rowIndex: number }>(values, PROGRESS_PARSERS)
    const now = new Date().toISOString()
    const existing = rows.find(r => r.user_id === userId && r.video_id === videoId)
    if (existing) {
        await updateRow(COURSES_SS(), 'video_progress', existing._rowIndex, headers, {
            ...existing, is_completed: isCompleted, completed_at: isCompleted ? now : ''
        })
    } else {
        const row = headers.map(h => {
            if (h === 'user_id') return userId
            if (h === 'video_id') return videoId
            if (h === 'is_completed') return String(isCompleted)
            if (h === 'completed_at') return isCompleted ? now : ''
            return ''
        })
        await appendRows(COURSES_SS(), 'video_progress', [row])
    }
}

// ─── Chats ────────────────────────────────────────────────────────────────────

export async function getChatsByUserId(userId: string): Promise<Chat[]> {
    return parseRows<Chat>(await readRange(COURSES_SS(), 'chats!A1:Z'))
        .filter(c => c.user_id === userId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function insertChat(data: Omit<Chat, 'id' | 'created_at'>): Promise<void> {
    const values = await readRange(COURSES_SS(), 'chats!A1:Z')
    if (!values?.length) return
    const row = objToRow(values[0], { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() })
    await appendRows(COURSES_SS(), 'chats', [row])
}

