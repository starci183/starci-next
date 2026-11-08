import type { LessonDifficulty, LessonLocale } from "@modules/domain/lesson"

/** Whether the lesson's tier-2 incident is written yet. */
export type IncidentStatus = "authored" | "coming-soon"

/** The filters of the incident list. */
export interface IncidentListFilter {
    /** The locale of the titles. */
    readonly locale: LessonLocale
    /** Only this topic, or null for every topic. */
    readonly topic: string | null
}

/** One row of the incident list: a Essentials lesson and whether it carries a tier-2 incident. */
export interface IncidentListItemView {
    /** The lesson id the incident belongs to. */
    readonly lessonId: string
    /** The lesson title in the asked locale. */
    readonly title: string
    /** The topic slug. */
    readonly topicId: string
    /** The topic title. */
    readonly topicTitle: string
    /** The catalog group. */
    readonly group: string
    /** The difficulty of the lesson. */
    readonly difficulty: LessonDifficulty
    /** The minutes the lesson takes. */
    readonly minutes: number
    /** Whether the incident is written and can be opened. */
    readonly incidentAvailable: boolean
    /** `authored` once the incident is written, `coming-soon` before. */
    readonly status: IncidentStatus
}
