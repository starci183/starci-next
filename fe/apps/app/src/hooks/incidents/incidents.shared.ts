import type { IncidentGroupView } from "@starci-next/ui"
import type { IncidentRows } from "@/hooks/swr"
import { lessonPath } from "@/modules/routes"

/** The words the incident list is built with, resolved by the block. */
export type IncidentWords = {
    /** The badge of a lesson whose incident is written. */
    readonly open: string
    /** The words of the action that opens an authored incident. */
    readonly cta: string
    /** The spoken names of the lesson difficulties. */
    readonly difficulty: Readonly<Record<string, string>>
    /** The line under a lesson: its difficulty and its minutes. */
    readonly meta: (difficulty: string, minutes: number) => string
}

/** Only the written incidents are listed (the API has no readiness filter yet), grouped by topic in the order the back end sent; a topic with none written is left out. */
export const incidentGroupsOf = (rows: IncidentRows, words: IncidentWords): ReadonlyArray<IncidentGroupView> => {
    const written = rows.filter((row) => row.incidentAvailable)
    const topics = [...new Set(written.map((row) => row.topicId))]
    return topics.map((topicId) => {
        const inTopic = written.filter((row) => row.topicId === topicId)
        return {
            id: topicId,
            label: inTopic[0]?.topicTitle ?? topicId,
            rows: inTopic.map((row) => ({
                id: row.lessonId,
                title: row.title,
                description: words.meta(words.difficulty[row.difficulty] ?? row.difficulty, row.minutes),
                badge: words.open,
                badgeTone: "success" as const,
                href: lessonPath(row.topicId, row.lessonId),
                cta: words.cta,
            })),
        }
    })
}

/** How many of the listed lessons have their incident written. */
export const authoredCountOf = (rows: IncidentRows): number => rows.filter((row) => row.incidentAvailable).length
