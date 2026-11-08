import { Alert, Button, RadioGroup, Stack, SurfaceCard } from "@starci/grammar/common"
import { AttemptNotice } from "../../leaves/AttemptNotice"

/** The words of a choice card, resolved by its block. */
export type ChoiceCardLabels = {
    readonly submit: string
    readonly retry: string
    readonly pending: string
    readonly correct: string
    readonly incorrect: string
    readonly saved: string
    readonly grading: string
    readonly failedSaved: string
    readonly error: string
    readonly premium: string
    readonly plans: string
}

/** Where the attempt of a choice stands. */
type ChoiceStatus = "idle" | "pending" | "saved" | "grading" | "graded" | "failed" | "premium" | "error"

/** One choice activity: the question, its options and, after the grade, the verdict with each option's explanation. */
type ChoiceCardProps = {
    readonly prompt: string
    readonly options: ReadonlyArray<{ readonly id: string; readonly label: string }>
    /** The option picked; empty before a pick. */
    readonly pickedId: string
    readonly status: ChoiceStatus
    /** Whether the graded pick was right; meaningful once the status is graded. */
    readonly isCorrect: boolean
    /** Why each option is or is not right, by option id; empty until the grade releases it. */
    readonly explanations: Readonly<Record<string, string>>
    readonly labels: ChoiceCardLabels
    /** The destination of the plans page, shown when the attempt asks for Premium. */
    readonly plansHref: string
    readonly onPick: (optionId: string) => void
    readonly onSubmit: () => void
}

/** What the verdict needs of the card. */
type VerdictProps = Pick<ChoiceCardProps, "status" | "isCorrect" | "labels" | "plansHref">

/** The verdict under the options: the grade once the server answered it, the notice of the attempt otherwise. */
const Verdict = (props: VerdictProps) => {
    if (props.status === "graded") {
        return (
            <Alert
                tone={props.isCorrect ? "affirmative" : "negative"}
                title={props.isCorrect ? props.labels.correct : props.labels.incorrect}
            />
        )
    }
    return (
        <AttemptNotice
            status={props.status}
            saved={props.labels.saved}
            grading={props.labels.grading}
            failedSaved={props.labels.failedSaved}
            error={props.labels.error}
            premium={props.labels.premium}
            plansLabel={props.labels.plans}
            plansHref={props.plansHref}
        />
    )
}

/** The label of the submit button from where the attempt stands. */
const submitLabelOf = (props: Pick<ChoiceCardProps, "status" | "labels">): string => {
    if (props.status === "pending" || props.status === "grading") return props.labels.pending
    return props.status === "error" ? props.labels.retry : props.labels.submit
}

/**
 * A choice question graded by the server: the learner picks one option and submits; the verdict and each option's
 * explanation come back from the attempt and are never held here before the grade.
 */
export const ChoiceCard = (props: ChoiceCardProps) => {
    const isPending = props.status === "pending" || props.status === "grading"
    const isSettled = props.status === "graded" || props.status === "saved"
    return (
        <SurfaceCard ariaLabel={props.prompt}>
            <Stack gap="row">
                <RadioGroup
                    label={props.prompt}
                    name={props.prompt}
                    options={props.options.map((option) => ({
                        value: option.id,
                        label: option.label,
                        ...(props.explanations[option.id] === undefined
                            ? {}
                            : { description: props.explanations[option.id] }),
                    }))}
                    value={props.pickedId === "" ? null : props.pickedId}
                    isDisabled={isPending || isSettled}
                    onValueChange={props.onPick}
                />
                <Verdict
                    status={props.status}
                    isCorrect={props.isCorrect}
                    labels={props.labels}
                    plansHref={props.plansHref}
                />
                <Button
                    intent="commit"
                    isPending={isPending}
                    isDisabled={props.pickedId === "" || isSettled}
                    onPress={props.onSubmit}
                >
                    {submitLabelOf(props)}
                </Button>
            </Stack>
        </SurfaceCard>
    )
}
