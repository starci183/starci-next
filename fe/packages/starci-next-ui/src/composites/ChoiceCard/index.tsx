import { Button, Cluster, EmptyNotice, Stack, SurfaceCard } from "@starci/grammar/common"
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
type ChoiceStatus = "idle" | "pending" | "saved" | "grading" | "graded" | "failed" | "premium"

/** One choice activity: the question, its options and, after the grade, the verdict with each option's explanation. */
type ChoiceCardProps = {
    readonly prompt: string
    readonly options: ReadonlyArray<{ readonly id: string; readonly label: string }>
    /** The option picked; empty before a pick. */
    readonly pickedId: string
    readonly status: ChoiceStatus
    /** True when the last send was rejected by the transport. */
    readonly isSendFailed: boolean
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

/** The label of the submit button from where the attempt stands. */
const submitLabelOf = (props: Pick<ChoiceCardProps, "status" | "isSendFailed" | "labels">): string => {
    if (props.status === "pending" || props.status === "grading") return props.labels.pending
    return props.isSendFailed ? props.labels.retry : props.labels.submit
}

/** What the feedback card needs. */
type FeedbackProps = Pick<ChoiceCardProps, "isCorrect" | "labels">

/** The verdict after the grade as one row; its tone mark says right or wrong. The reason of each option is the subtitle of its row above. */
const Feedback = (props: FeedbackProps) => {
    const words = props.isCorrect ? props.labels.correct : props.labels.incorrect
    return (
        <SurfaceCard
            kind="list"
            ariaLabel={words}
            empty={words}
            items={[{ id: "verdict", title: words, state: props.isCorrect ? "affirmative" : "negative" }]}
        />
    )
}

/** What the form footer needs. */
type FooterProps = Pick<ChoiceCardProps, "status" | "isSendFailed" | "pickedId" | "labels" | "plansHref" | "onSubmit">

/** The form footer: the attempt's notice, then the primary submit with its icon. */
const FormFooter = (props: FooterProps) => {
    const isPending = props.status === "pending" || props.status === "grading"
    const isSettled = props.status === "graded" || props.status === "saved"
    return (
        <Stack gap="row">
            <AttemptNotice
                status={props.status}
                isSendFailed={props.isSendFailed}
                saved={props.labels.saved}
                grading={props.labels.grading}
                failedSaved={props.labels.failedSaved}
                error={props.labels.error}
                premium={props.labels.premium}
                plansLabel={props.labels.plans}
                plansHref={props.plansHref}
            />
            <Cluster gap="inline" justify="end">
                <Button
                    intent="commit"
                    startGlyph="send"
                    isPending={isPending}
                    isDisabled={props.pickedId === "" || isSettled}
                    onPress={props.onSubmit}
                >
                    {submitLabelOf(props)}
                </Button>
            </Cluster>
        </Stack>
    )
}

/**
 * A choice question graded by the server: the learner picks one option and submits; the verdict and each option's
 * explanation come back from the attempt and are never held here before the grade.
 */
export const ChoiceCard = (props: ChoiceCardProps) => {
    const isBusy = props.status === "pending" || props.status === "grading"
    const isSettled = props.status === "graded" || props.status === "saved"
    if (props.status === "premium") {
        return (
            <SurfaceCard ariaLabel={props.prompt}>
                <EmptyNotice
                    frame="frameless"
                    message={props.labels.premium}
                    actionIntent="neutral"
                    actionLabel={props.labels.plans}
                    actionHref={props.plansHref}
                />
            </SurfaceCard>
        )
    }
    return (
        <Stack gap="row">
            <SurfaceCard
                kind="select"
                selectionMode="single"
                label={props.prompt}
                items={props.options.map((option) => {
                    const explanation = props.explanations[option.id]
                    return {
                        id: option.id,
                        title: option.label,
                        isDisabled: isBusy || isSettled,
                        ...(explanation === undefined ? {} : { subtitle: explanation }),
                    }
                })}
                value={props.pickedId === "" ? null : props.pickedId}
                onChange={props.onPick}
                footers={[
                    {
                        kind: "custom",
                        children: (
                            <FormFooter
                                status={props.status}
                                isSendFailed={props.isSendFailed}
                                pickedId={props.pickedId}
                                labels={props.labels}
                                plansHref={props.plansHref}
                                onSubmit={props.onSubmit}
                            />
                        ),
                    },
                ]}
            />
            {props.status === "graded" ? <Feedback isCorrect={props.isCorrect} labels={props.labels} /> : null}
        </Stack>
    )
}
