import { Alert, Badge, Button, Cluster, Heading, Stack, SurfaceCard, Text, Textarea } from "@starci/grammar/common"
import { AttemptNotice } from "../../leaves/AttemptNotice"

/** The words of a written-answer card, resolved by its block. */
export type WrittenCardLabels = {
    readonly answer: string
    readonly submit: string
    readonly retry: string
    readonly pending: string
    readonly diagnostic: string
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
    /** True for the opening diagnostic, which does not count toward passing. */
    readonly isDiagnostic: boolean
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

/** What the receipt needs of the card. */
type ReceiptProps = Pick<WrittenCardProps, "draft" | "labels" | "plansHref">

/** The words of a saved answer whose grading failed, by why it failed. */
const failedWordsOf = (props: ReceiptProps): string => {
    if (props.draft.issue === "unconfigured") return props.labels.failedUnconfigured
    return props.draft.issue === "limit" ? props.labels.failedLimit : props.labels.failedSaved
}

/** The line under the answer box: a saved answer whose grading failed says so, and says when no AI provider is set up. */
const Receipt = (props: ReceiptProps) => (
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
)

/** What the criteria row needs of the card. */
type CriteriaProps = Pick<WrittenCardProps, "criteria" | "labels">

/** The criteria of the question as quiet tags under a title. */
const Criteria = (props: CriteriaProps) =>
    props.criteria.length === 0 ? null : (
        <Stack gap="inline">
            <Text size="sm" tone="muted">
                {props.labels.criteria}
            </Text>
            <Cluster gap="inline">
                {props.criteria.map((criterion) => (
                    <Badge key={criterion} tone="muted">
                        {criterion}
                    </Badge>
                ))}
            </Cluster>
        </Stack>
    )

/** The tone of a graded level. */
const toneOf = (level: number): "success" | "warning" | "muted" => {
    if (level >= 2) return "success"
    return level === 1 ? "warning" : "muted"
}

/** What the grade needs of the card. */
type GradeProps = Pick<WrittenCardProps, "draft" | "labels">

/** The grade per criterion with the quote of the answer that earns it, and the score; nothing before a grade. */
const Grade = (props: GradeProps) =>
    props.draft.criteria.length === 0 ? null : (
        <Stack gap="row">
            <Text isStrong>{props.draft.scoreLine}</Text>
            {props.draft.criteria.map((each) => (
                <Stack key={each.id} gap="inline">
                    <Cluster gap="inline" wrap align="center">
                        <Badge tone={toneOf(each.level)}>
                            {props.labels.levels[Math.min(2, Math.max(0, each.level))] ?? ""}
                        </Badge>
                        <Text isStrong>{each.criterion}</Text>
                    </Cluster>
                    {each.evidence === "" ? null : (
                        <Text size="sm" tone="muted">
                            {`${props.labels.evidence}: ${each.evidence}`}
                        </Text>
                    )}
                </Stack>
            ))}
        </Stack>
    )

/** The label of the submit button from where the attempt stands. */
const submitLabelOf = (props: Pick<WrittenCardProps, "draft" | "labels">): string => {
    if (props.draft.status === "pending" || props.draft.status === "grading") return props.labels.pending
    return props.draft.status === "failed" || props.draft.status === "error" ? props.labels.retry : props.labels.submit
}

/**
 * A written answer saved before it is graded: the learner writes and submits; the grade per criterion comes back from the
 * attempt. When the grading fails the answer stays saved and the same revision can be sent again.
 */
export const WrittenCard = (props: WrittenCardProps) => {
    const isPending = props.draft.status === "pending" || props.draft.status === "grading"
    const isSettled = props.draft.status === "saved" || props.draft.status === "graded"
    return (
        <SurfaceCard ariaLabel={props.prompt}>
            <Stack gap="row">
                <Heading level={3} scale="standard">
                    {props.prompt}
                </Heading>
                {props.isDiagnostic ? <Alert tone="informative" title={props.labels.diagnostic} /> : null}
                {props.instructions === "" ? null : (
                    <Text as="p" tone="muted">
                        {props.instructions}
                    </Text>
                )}
                <Criteria criteria={props.criteria} labels={props.labels} />
                <Textarea
                    label={props.labels.answer}
                    name={props.prompt}
                    rows={6}
                    value={props.draft.value}
                    isDisabled={isPending}
                    onValueChange={props.onChange}
                />
                <Receipt draft={props.draft} labels={props.labels} plansHref={props.plansHref} />
                <Grade draft={props.draft} labels={props.labels} />
                <Button
                    intent="commit"
                    isPending={isPending}
                    isDisabled={props.draft.value.trim() === "" || isSettled || props.draft.issue === "limit"}
                    onPress={props.onSubmit}
                >
                    {submitLabelOf(props)}
                </Button>
            </Stack>
        </SurfaceCard>
    )
}
