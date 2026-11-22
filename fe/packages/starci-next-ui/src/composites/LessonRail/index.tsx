import { Stepper } from "@starci/grammar/common"

/** One part of the lesson on the rail: its name, where the learner stands in it and whether the plan lacks it. */
export type LessonRailStep = {
    readonly id: string
    readonly title: string
    /** The line under the name ("2/5 câu", "Premium"). */
    readonly note: string
    readonly state: "complete" | "current" | "upcoming"
}

/** What the rail needs. */
type LessonRailProps = {
    readonly label: string
    readonly steps: ReadonlyArray<LessonRailStep>
    /** The part on screen; empty when none is (the end-of-lesson screen). */
    readonly currentId: string
    readonly onSelect: (id: string) => void
    readonly isLoading?: boolean
}

/**
 * The five parts of the lesson, always on screen: a vertical stepper whose steps open their part. A part the plan lacks stays a step
 * the reader can open (the notice there says what Premium adds). Locked step and the contents of the current part are Grammar gaps.
 */
export const LessonRail = (props: LessonRailProps) => (
    <Stepper
        label={props.label}
        orientation="vertical"
        currentStepId={props.currentId}
        onStepSelect={props.onSelect}
        isLoading={props.isLoading === true}
        steps={props.steps.map((step) => ({
            id: step.id,
            label: props.isLoading === true ? "" : step.title,
            description: step.note,
            state: step.state,
        }))}
    />
)

/** What the phone bar needs. */
type LessonRailBarProps = {
    readonly label: string
    readonly steps: ReadonlyArray<LessonRailStep>
    readonly currentId: string
    /** "Phần 1/5 · Mở đầu · 2/5": the line under the bar. */
    readonly summary: string
    readonly isLoading?: boolean
}

/** The phone form of the rail: one segment per part, filled up to the current part, with where the reader is under it. */
export const LessonRailBar = (props: LessonRailBarProps) => (
    <Stepper
        kind="bar"
        label={props.label}
        currentStepId={props.currentId}
        isLoading={props.isLoading === true}
        steps={props.steps.map((step) => ({
            id: step.id,
            label: step.id === props.currentId ? props.summary : step.title,
            state: step.state,
        }))}
    />
)
