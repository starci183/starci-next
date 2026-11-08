import type { RelatedTopicRow, TopicLessonRow, TopicRow } from "./persistence/lesson.rows"
import type { LessonLocale } from "./lesson.contracts"
import type { LessonRelatedTopicView, LessonTopicStepView, LessonTopicView } from "./lesson-topic-view.contracts"

const relatedOf = (slug: string, rows: ReadonlyArray<RelatedTopicRow>): LessonRelatedTopicView => {
    const found = rows.find((candidate) => candidate.topic === slug)
    return { id: slug, title: found?.title ?? slug, listed: found?.listed ?? false }
}

/**
 * Builds the topic page: the stored path rows in the teacher's order, each linked to the published lesson converted from its
 * content folder, then a row for every published lesson of the topic that no path row names, so a lesson is never missing.
 */
export const toTopicView = (
    row: TopicRow,
    lessons: ReadonlyArray<TopicLessonRow>,
    group: string,
    locale: LessonLocale,
    related: ReadonlyArray<RelatedTopicRow> = [],
): LessonTopicView => {
    const byKey = new Map(lessons.map((lesson): [string | null, string] => [lesson.source_key, lesson.lesson_id]))
    const rows: Array<LessonTopicStepView> = row.path.map((step) => ({
        order: step.order,
        title: step.titles[locale],
        lessonId: byKey.get(step.key) ?? null,
    }))
    const placed = new Set(rows.map((step) => step.lessonId))
    const extra = lessons
        .filter((lesson) => !placed.has(lesson.lesson_id))
        .map((lesson, index): LessonTopicStepView => ({
            order: rows.length + index + 1,
            title: lesson.title,
            lessonId: lesson.lesson_id,
        }))
    return {
        id: row.topic,
        title: row.title,
        group,
        from: row.source_note,
        description: row.description,
        prerequisites: row.prerequisites,
        related: row.related?.map((slug): LessonRelatedTopicView => relatedOf(slug, related)) ?? null,
        path: [...rows, ...extra],
    }
}
