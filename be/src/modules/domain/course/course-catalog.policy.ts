import { z } from "zod"
import type {
    CourseCatalogDetailView,
    CourseCatalogEntryView,
    CourseCatalogLessonView,
    CourseLabTerms,
} from "./course-catalog.contracts"
import type { CourseRecord } from "./course-record.policy"

const terms = z.array(z.looseObject({ id: z.string().min(1), term: z.string().min(1) }))

/** The allowed terms of a stored lab record, or none when the record does not carry them in the lab@2 shape. */
export const labTermsOf = (value: unknown): CourseLabTerms => {
    const parsed = terms.safeParse(value)
    return parsed.success ? parsed.data.map((each) => ({ id: each.id, term: each.term })) : []
}

/**
 * One lesson of a course: its concept worded by the lab record's own term (else the concept id), and whether a lab is live. The lesson of a
 * one-lesson course is titled as its course (the concept's name in natural Vietnamese, the English name in en), so the catalog row and the
 * lesson's naming and submit pages say the same name; a lesson among several keeps its concept term.
 */
const lessonViewOf = (
    record: CourseRecord,
    lesson: CourseRecord["lessons"][number],
    labs: ReadonlyMap<string, CourseLabTerms>,
): CourseCatalogLessonView => {
    const held = labs.get(lesson.id)
    const conceptTerm = held?.find((each) => each.id === lesson.concept)?.term ?? lesson.concept
    const title = record.lessons.length === 1 ? { vi: record.title.vi, en: record.title.en } : { vi: conceptTerm, en: conceptTerm }
    return {
        lessonId: lesson.id,
        concept: lesson.concept,
        conceptTerm,
        title,
        available: held !== undefined,
    }
}

/** The catalog's order of two courses: by their place in the concept graph, a course with none after every course with one, then by id. */
export const catalogOrderCompare = (a: CourseCatalogEntryView, b: CourseCatalogEntryView): number => {
    const left = a.order ?? Number.POSITIVE_INFINITY
    const right = b.order ?? Number.POSITIVE_INFINITY
    if (left !== right) return left < right ? -1 : 1
    return a.courseId < b.courseId ? -1 : a.courseId > b.courseId ? 1 : 0
}

/** A course for the catalog list: its texts, its place in the graph's order and its lessons in teaching order, each marked available when a lab record of it is live. */
export const catalogEntryOf = (
    record: CourseRecord,
    labs: ReadonlyMap<string, CourseLabTerms>,
): CourseCatalogEntryView => ({
    courseId: record.id,
    title: { vi: record.title.vi, en: record.title.en },
    summary: { vi: record.summary.vi, en: record.summary.en },
    description: { vi: (record.description ?? record.summary).vi, en: (record.description ?? record.summary).en },
    order: record.order ?? null,
    lessons: record.lessons.map((each) => lessonViewOf(record, each, labs)),
})

/** One course with the system map of its intro. */
export const catalogDetailOf = (
    record: CourseRecord,
    labs: ReadonlyMap<string, CourseLabTerms>,
): CourseCatalogDetailView => ({
    ...catalogEntryOf(record, labs),
    system: {
        nodes: record.system.nodes.map((each) => ({
            id: each.id,
            service: each.service ?? null,
            label: { vi: each.label.vi, en: each.label.en },
            role: { vi: each.role.vi, en: each.role.en },
        })),
        edges: record.system.edges.map((each) => ({ from: each.from, to: each.to })),
    },
})
