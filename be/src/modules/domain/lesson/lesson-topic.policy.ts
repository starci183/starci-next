import type { LessonReference } from "./lesson.contracts"
import type { LessonTopicCatalog, LessonTopicResolution, LessonTopicStep } from "./lesson-topic.contracts"

const LEGACY_FOLDER = /(courses\/[^/;\s]+\/modules\/[^/;\s]+\/contents\/[^/;\s]+)\//u

/**
 * Places a lesson under its topic. A lesson with no entry, an entry whose topic is not defined, and a topic slug that is
 * also a lesson id are all refused, so a topic page route never collides with a lesson route.
 */
export const resolveTopic = (lessonId: string, catalog: LessonTopicCatalog): LessonTopicResolution => {
    const topic = catalog.byLesson[lessonId]
    if (topic === undefined) return { topic: null, source: null, issue: `lesson ${lessonId} has no topic entry` }
    if (topic === lessonId || Object.hasOwn(catalog.byLesson, topic)) {
        return { topic: null, source: null, issue: `topic ${topic} of lesson ${lessonId} is also a lesson id` }
    }
    const source = catalog.topics[topic]
    if (source === undefined) {
        return { topic: null, source: null, issue: `topic ${topic} of lesson ${lessonId} is not defined` }
    }
    return { topic, source, issue: null }
}

/** The V1 content folder a lesson was converted from, read from its legacy reference; null when it names none. */
export const sourceKeyOf = (references: ReadonlyArray<LessonReference>): string | null => {
    for (const reference of references) {
        const found = LEGACY_FOLDER.exec(reference.citation)?.[1]
        if (found !== undefined) return found
    }
    return null
}

/** Joins the paths of several source modules into one path with positions from 1. */
export const joinPaths = (paths: ReadonlyArray<ReadonlyArray<LessonTopicStep>>): Array<LessonTopicStep> =>
    paths.flat().map((step, index) => ({ ...step, order: index + 1 }))
