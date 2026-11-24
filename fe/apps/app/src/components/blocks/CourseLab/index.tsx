"use client"

import { useCourseLab, type CourseLabParams } from "@/hooks/courseLab"
import { CourseLabBase } from "./component"

/**
 * What the lesson page hands the lab: which lab, the faulty files and lines the code block marks, and what the submission carries
 * (the hints opened, the time spent and the design notes).
 */
type CourseLabProps = CourseLabParams

/** The connected lab panel of the "Sửa" step: resolves the read, the commands and the words in its hook and hands them to the presentational block. */
export const CourseLab = (props: CourseLabProps) => {
    const screen = useCourseLab(props)
    return <CourseLabBase props={screen.props} on={screen.on} />
}
