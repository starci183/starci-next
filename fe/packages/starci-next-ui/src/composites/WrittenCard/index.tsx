import { Button, Cluster, EmptyNotice, Stack, SurfaceCard, Text, Textarea } from "@starci/grammar/common"
import { AttemptNotice } from "../../leaves/AttemptNotice"

/** The words of a written-answer card, resolved by its block. */
export type WrittenCardLabels = {
    readonly answer: string
    readonly submit: string
    readonly retry: string
    readonly pending: string
    readonly criteria: string
    readonly saved: string
    readonly grading: string
    readonly failedSaved: string
    readonly failedUnconfigured: string
    /** The daily AI grading allowance is used up: the answer is kept and can be sent again tomorrow. */
    readonly failedLimit: string
    readonly error: string
    readonly premium: string
    readonly plans: string
    /** The words for level 0, 1 and 2 of a graded criterion. */
    readonly levels: readonly [string, string, string]
    readonly evidence: string
}

/** Where the attempt of a written answer stands. */
type WrittenStatus = "idle" | "pending" | "saved" | "grading" | "graded" | "failed" | "premium" | "error"

/** One graded criterion of the answer. */
type WrittenCriterion = {
    readonly id: string
    readonly criterion: string
    readonly level: number
    readonly evidence: string
    readonly maxScore: number
}

/** What the learner holds for the question: the text, where its attempt stands and the grade once there is one. */
type WrittenDraft = {
    readonly value: string
    readonly status: WrittenStatus
    readonly issue: "none" | "unconfigured" | "limit" | "other"
    readonly criteria: ReadonlyArray<WrittenCriterion>
    readonly scoreLine: string
    readonly isDiagnostic: boolean
}

/** One written activity (an explanation, an exercise, a review question): the question, its criteria and the answer box. */
type WrittenCardProps = {
    readonly prompt: string
    /** The names of the grading criteria, never their expected evidence. */
    readonly criteria: ReadonlyArray<string>
    /** What an exercise asks the learner to submit; empty for a question. */
    readonly instructions: string
    readonly draft: WrittenDraft
    readonly labels: WrittenCardLabels
    /** The destination of the plans page, shown when the attempt asks for Premium. */
    readonly plansHref: string
    readonly onChange: (text: string) => void
    readonly onSubmit: () => void
}

/** What the criteria rows need of the card. */
type CriteriaProps = Pick<WrittenCardProps, "criteria" | "labels">

/** The criteria of the question as the rows of one list card; nothing when the question has none. */
const Criteria = (props: CriteriaProps) =>
    props.criteria.length === 0 ? null : (
        <SurfaceCard
            kind="list"
            label={props.labels.criteria}
            empty={props.labels.criteria}
            items={props.criteria.map((criterion) => ({ id: criterion, title: criterion }))}
        />
    )

/** The tone of a graded level. */
const toneOf = (level: number): "success" | "warning" | "muted" => {
    if (level >= 2) return "success"
    return level === 1 ? "warning" : "muted"
}

/** What the grade needs of the card. */
type GradeProps = Pick<WrittenCardProps, "draft" | "labels">

/** The grade per criterion as the rows of one list card: the level, the criterion and the quote of the answer that earns it; nothing before a grade. */
const Grade = (props: GradeProps) =>
    props.draft.criteria.length === 0 ? null : (
        <SurfaceCard
            kind="list"
            label={props.draft.scoreLine}
            empty={props.draft.scoreLine}
            items={props.draft.criteria.map((each) => ({
                id: each.id,
                title: each.criterion,
                ...(each.evidence === "" ? {} : { description: `${props.labels.evidence}: ${each.evidence}` }),
                badges: [
                    {
                        label: props.labels.levels[Math.min(2, Math.max(0, each.level))] ?? "",
                        tone: toneOf(each.level),
                    },
                ],
            }))}
        />
    )

/** The label of the submit button from where the attempt stands. */
const submitLabelOf = (props: Pick<WrittenCardProps, "draft" | "labels">): string => {
    if (props.draft.status === "pending" || props.draft.status === "grading") return props.labels.pending
    return props.draft.status === "failed" || props.draft.status === "error" ? props.labels.retry : props.labels.submit
}

/** The words of a saved answer whose grading failed, by why it failed. */
const failedWordsOf = (props: Pick<WrittenCardProps, "draft" | "labels">): string => {
    if (props.draft.issue === "unconfigured") return props.labels.failedUnconfigured
    return props.draft.issue === "limit" ? props.labels.failedLimit : props.labels.failedSaved
}

/**
 * A written answer saved before it is graded: the learner writes and submits; the grade per criterion comes back from the
 * attempt. When the grading fails the answer stays saved and the same revision can be sent again.
 */
export const WrittenCard = (props: WrittenCardProps) => {
    const isPending = props.draft.status === "pending" || props.draft.status === "grading"
    const isSettled = props.draft.status === "saved" || props.draft.status === "graded"
    if (props.draft.status === "premium") {
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
            <Criteria criteria={props.criteria} labels={props.labels} />
            <SurfaceCard
                ariaLabel={props.prompt}
                footers={[
                    {
                        kind: "custom",
                        children: (
                            <Cluster gap="inline" justify="end">
                                <Button
                                    intent="commit"
                                    startGlyph="send"
                                    isPending={isPending}
                                    isDisabled={props.draft.value.trim() === "" || isSettled || props.draft.issue === "limit"}
                                    onPress={props.onSubmit}
                                >
                                    {submitLabelOf(props)}
                                </Button>
                            </Cluster>
                        ),
                    },
                ]}
            >
                <Stack gap="row">
                    <Text isStrong>{props.prompt}</Text>
                    <Textarea
                        label={props.labels.answer}
                        isLabelHidden
                        name={props.prompt}
                        rows={3}
                        {...(props.instructions === "" || props.instructions === props.prompt
                            ? {}
                            : { description: props.instructions })}
                        value={props.draft.value}
                        isDisabled={isPending}
                        onValueChange={props.onChange}
                    />
                    <AttemptNotice
                        status={props.draft.status}
                        saved={props.labels.saved}
                        grading={props.labels.grading}
                        failedSaved={failedWordsOf(props)}
                        error={props.labels.error}
                        premium={props.labels.premium}
                        plansLabel={props.labels.plans}
                        plansHref={props.plansHref}
                    />
                </Stack>
            </SurfaceCard>
            <Grade draft={props.draft} labels={props.labels} />
        </Stack>
    )
}
