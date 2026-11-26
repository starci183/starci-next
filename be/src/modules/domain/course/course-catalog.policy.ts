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

/** One lesson of a course: its concept worded by the lab record's own term (else the concept id), and whether a lab is live. */
const lessonViewOf = (
    lesson: CourseRecord["lessons"][number],
    labs: ReadonlyMap<string, CourseLabTerms>,
): CourseCatalogLessonView => {
    const held = labs.get(lesson.id)
    const conceptTerm = held?.find((each) => each.id === lesson.concept)?.term ?? lesson.concept
    return {
        lessonId: lesson.id,
        concept: lesson.concept,
        conceptTerm,
        title: { vi: conceptTerm, en: conceptTerm },
        available: held !== undefined,
    }
}

/** A course for the catalog list: its texts and its lessons in teaching order, each marked available when a lab record of it is live. */
export const catalogEntryOf = (
    record: CourseRecord,
    labs: ReadonlyMap<string, CourseLabTerms>,
): CourseCatalogEntryView => ({
    courseId: record.id,
    title: { vi: record.title.vi, en: record.title.en },
    summary: { vi: record.summary.vi, en: record.summary.en },
    lessons: record.lessons.map((each) => lessonViewOf(each, labs)),
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
