"use client"

import { useCourseLessonScreen } from "@/hooks/courseLesson"
import { CourseLessonBase } from "./component"

/** What the route hands the lesson block: the lesson and the `page` and `case` queries, all atoms. */
type CourseLessonProps = {
    readonly lessonId: string
    /** The raw `page` query; anything that names no page opens the intro. */
    readonly page: string | undefined
    /** The raw `case` query: the case a loop opens on. */
    readonly caseId: string | undefined
}

/** The connected lab lesson page: resolves the world in its hook and hands it to the presentational block. */
export const CourseLesson = (props: CourseLessonProps) => {
    const screen = useCourseLessonScreen(props)
    return <CourseLessonBase props={screen.props} on={screen.on} />
}
