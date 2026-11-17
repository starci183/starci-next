import { Stepper, type StepperStepState } from "@starci/grammar/common"
import type { StepView, StudyBodyProps } from "../StudyBody/types"

/** The Grammar state of each step state: the server decides which phases are done, so the position does not. */
const STEP_STATE: Readonly<Record<StepView["state"], StepperStepState>> = {
    done: "complete",
    current: "current",
    later: "upcoming",
}

/** What the stepper needs: the lesson and the environment it is drawn in. */
type LessonStepperProps = StudyBodyProps

/** The six steps of the lesson as a stepper: done (check), current (filled), later (muted); each step opens its phase. */
export const LessonStepper = (props: LessonStepperProps) => {
    const { study, env } = props
    const current = study.stepper.find((step) => step.state === "current")
    return (
        <Stepper
            label={env.labels.nav.stepper}
            steps={study.stepper.map((step) => ({
                id: step.phase,
                label: env.labels.phases[step.phase].title,
                state: STEP_STATE[step.state] ?? "upcoming",
            }))}
            currentStepId={current?.phase ?? ""}
            completeMarker="check"
            size="dense"
            stateLabel={(state) => (state === "complete" ? env.labels.nav.stepStates.done : undefined)}
            onStepSelect={env.on.openPhase}
        />
    )
}
