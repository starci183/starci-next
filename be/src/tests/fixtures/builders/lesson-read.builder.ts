import type { LessonProgressView } from "@modules/domain/attempt"
import type { LessonCatalogItemView } from "@modules/domain/lesson"

/** A catalog entry of a lesson with the given id and title (the id when none is given). */
export const catalogItemOf = (id: string, title: string = id): LessonCatalogItemView => ({
    id,
    version: "1.0.0",
    title,
    description: title,
    category: "concept",
    group: "core",
    topic: { id: "topic", title: "Topic" },
    difficulty: "foundation",
    minutes: 10,
    languages: [],
    providers: [],
})

/** The progress of a learner in a lesson with the given number of attempts. */
export const progressOf = (lessonId: string, total: number): LessonProgressView => ({
    lessonId,
    version: null,
    phase: "challenge",
    outcomes: [],
    attempts: { total, activities: 0, graded: 0, failed: 0, pending: 0 },
    activities: [],
})
