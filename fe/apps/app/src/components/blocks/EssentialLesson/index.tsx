"use client"

import { useEssentialLessonScreen } from "@/hooks/essentialLesson"
import { EssentialLessonBase } from "./component"

/** What the route hands the lesson block: the lesson and the `part` and `scenario` queries, all atoms. */
type EssentialLessonProps = {
    readonly lessonId: string
    /** The raw `part` query; anything that names no part opens Bản chất. */
    readonly part: string | undefined
    /** The raw `scenario` query: the scenario Kịch bản opens on. */
    readonly scenario: string | undefined
}

/** The connected four-part lesson page: resolves the world in its hook and hands it to the presentational block. */
export const EssentialLesson = (props: EssentialLessonProps) => {
    const screen = useEssentialLessonScreen(props)
    return <EssentialLessonBase props={screen.props} on={screen.on} />
}
