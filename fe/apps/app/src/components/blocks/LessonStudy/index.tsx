"use client"

import { useLessonStudyScreen } from "@/hooks/lessonStudy"
import { LessonStudyBase } from "./component"

/** What the route hands the study block: the lesson and the `phase` query, both atoms. */
type LessonStudyProps = {
    readonly lessonId: string
    /** The raw `phase` query value; anything that names no phase opens the overview. */
    readonly phase: string | undefined
}

/** The connected study screen of one lesson: resolves the world in its hook and hands it to the presentational block. */
export const LessonStudy = (props: LessonStudyProps) => {
    const screen = useLessonStudyScreen(props)
    return <LessonStudyBase props={screen.props} on={screen.on} />
}
