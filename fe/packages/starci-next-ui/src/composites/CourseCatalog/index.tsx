import { Section, Stack } from "@starci/grammar/common"

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

/** The courses of Essentials v2, one flat list of lessons each; a lesson with a lab links to its six pages. */
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
                    title: lesson.title,
                    description: lesson.concept,
                    ...(lesson.href === undefined
                        ? { badges: [{ label: props.labels.soon, tone: "muted" as const }] as const }
                        : { href: lesson.href }),
                }))}
            />
        ))}
    </Stack>
)
