import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { EssentialLesson } from "@/components/blocks/EssentialLesson"
import { LessonStudy } from "@/components/blocks/LessonStudy"
import type { ReactElement } from "react"

/** What the route hands the lesson page: the lesson in the address and the raw `part`, `scenario` and `phase` queries. */
type LessonPageProps = {
    readonly lessonId: string
    /** The phase of an older link (`?phase=`): the six-phase study pages stay reachable by it. */
    readonly phase: string | undefined
    /** The part of the four-part page (`?part=`). */
    readonly part: string | undefined
    /** The scenario Kịch bản opens on (`?scenario=`). */
    readonly scenario: string | undefined
}

/** The document title of the lesson page, from the catalog of the requested locale. */
export const lessonPageMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.essentials.study")
    return { title: t("pageTitle") }
}

/**
 * The page of one lesson: the four parts (Bản chất, Source, Kịch bản, Tự áp dụng); a link that names a phase of the older
 * six-phase study keeps opening that phase.
 */
export const LessonPage = (props: LessonPageProps): ReactElement =>
    props.phase === undefined ? (
        <EssentialLesson lessonId={props.lessonId} part={props.part} scenario={props.scenario} />
    ) : (
        <LessonStudy lessonId={props.lessonId} phase={props.phase} />
    )
