import { Section, Stack } from "@starci/grammar/common"
import { EssentialsGlyph, LockGlyph } from "../../leaves/Icon"

/** One lesson of a course as a row: its title, its concept and where it opens. */
export type CourseCatalogLessonView = {
    readonly id: string
    readonly title: string
    /** The term of the lesson's own concept. */
    readonly concept: string
    /** Where the lesson opens; undefined while the lesson has no lab yet. */
    readonly href: string | undefined
}

/** One course: its name, what it is and its lessons in order. */
export type CourseCatalogCourseView = {
    readonly id: string
    readonly title: string
    readonly summary: string
    readonly lessons: ReadonlyArray<CourseCatalogLessonView>
}

/** The words of the catalog. */
export type CourseCatalogLabels = {
    readonly lessonsEmpty: string
    /** The mark of a lesson that is not published yet. */
    readonly soon: string
}

/** What the catalog needs. */
type CourseCatalogProps = {
    readonly courses: ReadonlyArray<CourseCatalogCourseView>
    readonly labels: CourseCatalogLabels
    readonly isLoading?: boolean
}

/**
 * The words of a lesson row. Its title is the name of the lesson's concept ("Idempotency key", "Saga"; lessons.md §1: a lesson is titled by
 * its concept, never by a story), and the lesson's own title stands under it only when it says something the concept does not ("Saga" under
 * "Saga" says it twice). A lesson whose concept has no term yet keeps its own title.
 */
const wordsOf = (lesson: CourseCatalogLessonView): { readonly title: string; readonly description?: string } => {
    if (lesson.concept === "") return { title: lesson.title }
    const isSame = lesson.concept.trim().toLowerCase() === lesson.title.trim().toLowerCase()
    return isSame || lesson.title === "" ? { title: lesson.concept } : { title: lesson.concept, description: lesson.title }
}

/**
 * The courses of Essentials, one flat list of lessons each, in the order the course grows its system. Every row leads with a Grammar
 * identity tile, as the lesson pages lead their lists (lessons.md §7): the concept glyph for a lesson with a lab, which links to its pages,
 * and the lock on the grey plate for one not published yet, which carries the "soon" badge and opens nothing.
 */
export const CourseCatalog = (props: CourseCatalogProps) => (
    <Stack gap="region">
        {props.courses.map((course) => (
            <Section
                key={course.id}
                kind="list"
                title={course.title}
                caption={course.summary}
                headingLevel={2}
                isLoading={props.isLoading === true}
                empty={props.labels.lessonsEmpty}
                items={course.lessons.map((lesson) => ({
                    id: lesson.id,
                    ...wordsOf(lesson),
                    ...(lesson.href === undefined
                        ? {
                              leading: { icon: LockGlyph },
                              badges: [{ label: props.labels.soon, tone: "muted" as const }] as const,
                          }
                        : { leading: { icon: EssentialsGlyph }, href: lesson.href }),
                }))}
            />
        ))}
    </Stack>
)
