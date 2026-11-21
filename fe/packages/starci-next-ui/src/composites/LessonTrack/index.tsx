import { Stepper, type StepperStepState } from "@starci/grammar/common"

/** One lesson of the track. */
type LessonTrackStep = {
    readonly id: string
    readonly title: string
    /** The one-line problem the lesson solves. */
    readonly problem: string
    readonly state: "todo" | "doing" | "done"
}

/** Props of the track. */
type LessonTrackProps = {
    readonly label: string
    readonly steps: ReadonlyArray<LessonTrackStep>
    /** The words of each state, read by assistive technology. */
    readonly stateLabels: { readonly done: string; readonly doing: string; readonly todo: string }
    /** The reader picked a lesson. */
    readonly onSelect: (id: string) => void
    readonly isLoading?: boolean
}

/** The state of a step in the stepper words. */
const STATE_OF: Readonly<Record<LessonTrackStep["state"], StepperStepState>> = {
    done: "complete",
    doing: "current",
    todo: "upcoming",
}

/** The word of a step state. */
const labelOf = (labels: LessonTrackProps["stateLabels"], state: StepperStepState): string => {
    if (state === "complete") return labels.done
    if (state === "current") return labels.doing
    return labels.todo
}

/** The lessons of a topic as a path of round nodes: done, the one under way, not started. */
export const LessonTrack = (props: LessonTrackProps) => {
    const current =
        props.steps.find((step) => step.state === "doing") ?? props.steps.find((step) => step.state === "todo")
    return (
        <Stepper
            label={props.label}
            steps={props.steps.map((step) => ({
                id: step.id,
                label: step.title,
                description: step.problem,
                state: STATE_OF[step.state],
            }))}
            currentStepId={current?.id ?? props.steps[0]?.id ?? ""}
            completeMarker="check"
            stateLabel={(state) => labelOf(props.stateLabels, state)}
            onStepSelect={props.onSelect}
            isLoading={props.isLoading ?? false}
        />
    )
}
