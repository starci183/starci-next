"use client"

import { useCourseLab, type CourseLabParams } from "@/hooks/courseLab"
import { CourseLabBase } from "./component"

/**
 * What the lesson page hands the lab: which lab, which part of it the page shows (`stage`), the faulty files and lines the code block
 * marks, the current case and what the submission carries (the hints opened and the time spent).
 */
type CourseLabProps = CourseLabParams

/** The connected lab panel of one part of the lesson: resolves the read, the commands and the words in its hook and hands them to the presentational block. */
export const CourseLab = (props: CourseLabProps) => {
    const screen = useCourseLab(props)
    return <CourseLabBase props={screen.props} on={screen.on} part={props.part ?? "all"} />
}
