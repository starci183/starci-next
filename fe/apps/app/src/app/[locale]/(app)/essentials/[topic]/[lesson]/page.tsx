import { LessonPage } from "@/features/pages/LessonPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { lessonPageMetadata as generateMetadata } from "@/features/pages/LessonPage"

/** The lesson route's framework inputs: the topic and the lesson in the address and the query that names the phase. */
type PageProps = {
    readonly params: Promise<{ readonly topic: string; readonly lesson: string }>
    readonly searchParams: Promise<Readonly<Record<string, string | ReadonlyArray<string> | undefined>>>
}

/** The first value of a query parameter that may repeat. */
const firstOf = (value: string | ReadonlyArray<string> | undefined): string | undefined =>
    typeof value === "string" ? value : value?.[0]

/** The lesson slot: it hands the lesson id and the phase query to the lesson page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => {
    const { lesson } = await props.params
    const { phase } = await props.searchParams
    return <LessonPage lessonId={lesson} phase={firstOf(phase)} />
}

export default Page
