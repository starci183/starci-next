import type { IncidentGroupView } from "@starci-next/ui"
import type { IncidentRows } from "@/hooks/swr"
import { lessonPath } from "@/modules/routes"

/** The words the incident list is built with, resolved by the block. */
export type IncidentWords = {
    /** The badge of a lesson whose incident is not written yet. */
    readonly soon: string
    /** The badge of a lesson whose incident is written. */
    readonly open: string
    /** The words of the action that opens an authored incident. */
    readonly cta: string
    /** The spoken names of the lesson difficulties. */
    readonly difficulty: Readonly<Record<string, string>>
    /** The line under a lesson: its difficulty and its minutes. */
    readonly meta: (difficulty: string, minutes: number) => string
}

/** The incident rows of one topic keep the order the back end sent (authored first, then the catalog order). */
export const incidentGroupsOf = (rows: IncidentRows, words: IncidentWords): ReadonlyArray<IncidentGroupView> => {
    const topics = [...new Set(rows.map((row) => row.topicId))]
    return topics.map((topicId) => {
        const inTopic = rows.filter((row) => row.topicId === topicId)
        return {
            id: topicId,
            label: inTopic[0]?.topicTitle ?? topicId,
            rows: inTopic.map((row) => ({
                id: row.lessonId,
                title: row.title,
                description: words.meta(words.difficulty[row.difficulty] ?? row.difficulty, row.minutes),
                badge: row.incidentAvailable ? words.open : words.soon,
                badgeTone: row.incidentAvailable ? ("success" as const) : ("muted" as const),
                href: row.incidentAvailable ? lessonPath(row.topicId, row.lessonId) : "",
                cta: row.incidentAvailable ? words.cta : "",
            })),
        }
    })
}

/** How many of the listed lessons have their incident written. */
export const authoredCountOf = (rows: IncidentRows): number => rows.filter((row) => row.incidentAvailable).length
