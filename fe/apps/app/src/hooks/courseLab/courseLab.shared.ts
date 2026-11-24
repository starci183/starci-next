import type { DataSlot, LabBody, LabNoticeView, LessonLabActions } from "@starci-next/ui"
import type { CourseLabFaulty, CourseLabState } from "@/modules/course-lab"
import type { CourseLabLabels } from "./useCourseLabLabels"

/** What the lesson page hands the lab: which lab, the faulty places it marks and what the submission carries. */
export type CourseLabParams = {
    readonly courseId: string
    readonly lessonId: string
    /** The files and lines the lesson says are faulty; the code block marks them. */
    readonly faulty: ReadonlyArray<CourseLabFaulty>
    /** How many hints of the ladder the learner opened; the submission carries it. */
    readonly hintsOpened: number
    /** How long the learner has spent on the step, in milliseconds; the submission carries it. */
    readonly timeSpentMs: number
    /** The learner's design notes, one string each; the submission carries them. */
    readonly designDoc: ReadonlyArray<string>
}

/** The lab as the panel draws it once read: what to draw and the notice above it. */
export type CourseLabPanelView = {
    readonly body: LabBody
    readonly notice: LabNoticeView | undefined
}

/** What the lab block draws from. */
export type CourseLabScreenProps = {
    readonly lab: DataSlot<CourseLabPanelView>
    /** The ready lab with blank words: the skeleton of the first read. */
    readonly placeholder: CourseLabPanelView
    readonly labels: CourseLabLabels
}

/** The lab screen: what the block draws, what the learner does and the summary the page gates on. */
export type CourseLabScreen = {
    readonly props: CourseLabScreenProps
    readonly on: LessonLabActions & { readonly retry: () => void }
    readonly labState: CourseLabState
}
