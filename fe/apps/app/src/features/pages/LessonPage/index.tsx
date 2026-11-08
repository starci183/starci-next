import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { LessonStudy } from "@/components/blocks/LessonStudy"
import type { ReactElement } from "react"

/** What the route hands the lesson page: the lesson in the address and the raw `phase` query. */
type LessonPageProps = {
    readonly lessonId: string
    readonly phase: string | undefined
}

/** The document title of the lesson page, from the catalog of the requested locale. */
export const lessonPageMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.essentials.study")
    return { title: t("pageTitle") }
}

/** The study page of one lesson: a server owner that mounts the block that reads the lesson and draws its phase. */
export const LessonPage = (props: LessonPageProps): ReactElement => (
    <LessonStudy lessonId={props.lessonId} phase={props.phase} />
)
