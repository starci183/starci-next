import type { DataSlot, LabBody, LabNoticeView, LessonLabActions } from "@starci-next/ui"
import type { CourseLabCaseResult, CourseLabFaulty, CourseLabStage, CourseLabState } from "@/modules/course-lab"
import type { CourseLabLabels } from "./useCourseLabLabels"

/**
 * What a lesson page hands the lab: which lab, which part of it the page shows, the faulty places it marks, the current case and what the
 * submission carries.
 */
export type CourseLabParams = {
    readonly courseId: string
    readonly lessonId: string
    /** The setup page, the lab column of a happy or unhappy loop, or the submit page. */
    readonly stage: CourseLabStage
    /** The files and lines the lesson says are faulty; the code block marks them. */
    readonly faulty: ReadonlyArray<CourseLabFaulty>
    /** The current case of the loop page: its title, state and, when red, the invariant that failed with what was expected and found; undefined when the page shows none. */
    readonly caseResult: CourseLabCaseResult | undefined
    /** How many hints of the ladder the learner opened; the submission carries it. */
    readonly hintsOpened: number
    /** How long the learner has spent on the lesson, in milliseconds; the submission carries it. */
    readonly timeSpentMs: number
}

/** The lab as the panel draws it once read: what to draw and the notice above it. */
export type CourseLabPanelView = {
    readonly body: LabBody
    readonly notice: LabNoticeView | undefined
}

/** What the lab block draws from. */
export type CourseLabScreenProps = {
    readonly lab: DataSlot<CourseLabPanelView>
    /** The ready lab of the page's stage with blank words: the skeleton of the first read. */
    readonly placeholder: CourseLabPanelView
    readonly labels: CourseLabLabels
}

/** What the learner does in the lab beyond the panel: the retry of a failed read and the two doors the page may use. */
export type CourseLabPageActions = {
    readonly retry: () => void
    /** Asks the machine to run the visible tests with the chaos switches that are on. */
    readonly runTests: () => void
    /** Asks the machine to turn exactly these chaos switches on and run the visible tests again. */
    readonly setChaos: (chaosIds: ReadonlyArray<string>) => void
}

/** The lab screen: what the block draws, what the learner does and the summary the page gates on. */
export type CourseLabScreen = {
    readonly props: CourseLabScreenProps
    readonly on: LessonLabActions & CourseLabPageActions
    readonly labState: CourseLabState
}
