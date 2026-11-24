import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { CourseLesson } from "@/components/blocks/CourseLesson"
import type { ReactElement } from "react"

/** What the route hands the lesson page: the lesson in the address and the raw `page` and `case` queries. */
type CourseLessonPageProps = {
    readonly courseId: string
    readonly lessonId: string
    /** The page of the six (`?page=`). */
    readonly page: string | undefined
    /** The case a loop opens on (`?case=`). */
    readonly caseId: string | undefined
}

/** The document title of the lab lesson page, from the catalog of the requested locale. */
export const courseLessonPageMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.courseLesson")
    return { title: t("pageTitle") }
}

/** The page of one lab lesson: a server owner that mounts the lesson block with the address's atoms. */
export const CourseLessonPage = (props: CourseLessonPageProps): ReactElement => (
    <CourseLesson courseId={props.courseId} lessonId={props.lessonId} page={props.page} caseId={props.caseId} />
)
