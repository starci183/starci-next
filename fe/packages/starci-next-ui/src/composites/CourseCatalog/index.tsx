import { Section, Stack } from "@starci/grammar/common"
import { LockGlyph, numberGlyph } from "../../leaves/Icon"

/** One lesson of a course as a row: its title, its concept and where it opens. */
export type CourseCatalogLessonView = {
    readonly id: string
    readonly title: string
    /** The term of the lesson's own concept. */
    readonly concept: string
    /** Where the lesson opens; undefined while the lesson has no lab yet. */
    readonly href: string | undefined
}

/** One course: its name, its English name, its one-line description, what it is and its lessons in order. */
export type CourseCatalogCourseView = {
    readonly id: string
    /** The concept's name in the reader's language ("Thiết kế dữ liệu", "Saga"). */
    readonly title: string
    /** The concept's English name ("Data modeling"), drawn as a badge when it differs from the title. */
    readonly englishName: string
    /** The one sentence of what the concept does (lessons.md §1), the caption of its row. */
    readonly description: string
    readonly summary: string
    readonly lessons: ReadonlyArray<CourseCatalogLessonView>
}

/** The words of the catalog. */
export type CourseCatalogLabels = {
    readonly lessonsEmpty: string
    /** The mark of a lesson that is not published yet. */
    readonly soon: string
    /** The name of the one list of lessons, for a screen reader: the page title already heads it. */
    readonly listLabel: string
}

/** What the catalog needs. */
type CourseCatalogProps = {
    readonly courses: ReadonlyArray<CourseCatalogCourseView>
    readonly labels: CourseCatalogLabels
    readonly isLoading?: boolean
}

/** One drawn row: the lesson, its place in the whole catalog (1-based) and its words. */
type CatalogRow = {
    readonly lesson: CourseCatalogLessonView
    readonly position: number
    readonly title: string
    readonly englishName: string
    readonly description: string | undefined
}

/** A run of rows the page draws as one block: one list of one-lesson courses (no heading), or a course of several lessons under its heading. */
type CatalogBlock =
    | { readonly kind: "rows"; readonly id: string; readonly rows: ReadonlyArray<CatalogRow> }
    | { readonly kind: "course"; readonly course: CourseCatalogCourseView; readonly rows: ReadonlyArray<CatalogRow> }

const same = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * The courses as blocks, numbered through in the order given (the concept graph's teaching order). A course of one lesson is ONE row (rule D:
 * a heading that repeats the item under it is dropped): the course's name, its English name as a badge and its description as the caption;
 * consecutive one-lesson courses share one list. A course of several lessons keeps its heading, one row per lesson.
 */
const blocksOf = (courses: ReadonlyArray<CourseCatalogCourseView>): ReadonlyArray<CatalogBlock> => {
    const blocks: Array<CatalogBlock> = []
    let position = 0
    for (const course of courses) {
        if (course.lessons.length === 1) {
            const lesson = course.lessons[0]!
            position += 1
            const row: CatalogRow = {
                lesson,
                position,
                title: course.title === "" ? lesson.title : course.title,
                englishName: course.englishName,
                description: course.description === "" ? undefined : course.description,
            }
            const last = blocks.at(-1)
            if (last?.kind === "rows") blocks[blocks.length - 1] = { ...last, rows: [...last.rows, row] }
            else blocks.push({ kind: "rows", id: course.id, rows: [row] })
            continue
        }
        const rows = course.lessons.map((lesson) => {
            position += 1
            return { lesson, position, title: lesson.title === "" ? lesson.concept : lesson.title, englishName: lesson.concept, description: undefined }
        })
        blocks.push({ kind: "course", course, rows })
    }
    return blocks
}

/**
 * One row: the round number tile (a status mark with the numeral as its glyph, lessons.md §7: every number is a round IconTile, never a
 * square step), the name, the English name as a badge when it says something the name does not, and the description. A lesson with no lab
 * yet leads with the lock, carries the "soon" badge and opens nothing.
 */
const itemOf = (row: CatalogRow, labels: CourseCatalogLabels) => {
    const english = row.englishName === "" || same(row.englishName, row.title) ? [] : [{ label: row.englishName }]
    const words = { id: row.lesson.id, title: row.title, ...(row.description === undefined ? {} : { description: row.description }) }
    if (row.lesson.href === undefined) {
        const soon = { label: labels.soon, tone: "muted" as const }
        return { ...words, leading: { icon: LockGlyph }, badges: english.length === 0 ? ([soon] as const) : ([english[0]!, soon] as const) }
    }
    return {
        ...words,
        leading: { icon: numberGlyph(row.position), state: "notRun" as const },
        ...(english.length === 0 ? {} : { badges: [english[0]!] as const }),
        href: row.lesson.href,
    }
}

/**
 * The Essentials catalog: one list of concepts in the order the concept graph teaches them, each row a number, the concept's name, its
 * English name and one sentence of what it does, linking to the lesson's pages. A course of several lessons keeps its own heading.
 */
export const CourseCatalog = (props: CourseCatalogProps) => {
    const isLoading = props.isLoading === true
    return (
        <Stack gap="region">
            {blocksOf(props.courses).map((block) =>
                block.kind === "rows" ? (
                    <Section
                        key={`rows-${block.id}`}
                        kind="list"
                        ariaLabel={props.labels.listLabel}
                        isLoading={isLoading}
                        empty={props.labels.lessonsEmpty}
                        items={block.rows.map((row) => itemOf(row, props.labels))}
                    />
                ) : (
                    <Section
                        key={block.course.id}
                        kind="list"
                        title={block.course.title}
                        caption={block.course.description}
                        headingLevel={2}
                        isLoading={isLoading}
                        empty={props.labels.lessonsEmpty}
                        items={block.rows.map((row) => itemOf(row, props.labels))}
                    />
                ),
            )}
        </Stack>
    )
}
