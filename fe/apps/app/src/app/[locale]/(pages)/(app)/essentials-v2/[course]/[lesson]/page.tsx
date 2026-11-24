import { CourseLessonPage } from "@/features/pages/CourseLessonPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { courseLessonPageMetadata as generateMetadata } from "@/features/pages/CourseLessonPage"

/** The lab lesson route's framework inputs: the course and the lesson in the address and the queries that name the page and the case. */
type PageProps = {
    readonly params: Promise<{ readonly course: string; readonly lesson: string }>
    readonly searchParams: Promise<Readonly<Record<string, string | ReadonlyArray<string> | undefined>>>
}

/** The first value of a query parameter that may repeat. */
const firstOf = (value: string | ReadonlyArray<string> | undefined): string | undefined =>
    typeof value === "string" ? value : value?.[0]

/** The lesson slot: it hands the course and lesson ids and the page and case queries to the lesson page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => {
    const { course, lesson } = await props.params
    const { page, case: caseId } = await props.searchParams
    return <CourseLessonPage courseId={course} lessonId={lesson} page={firstOf(page)} caseId={firstOf(caseId)} />
}

export default Page
