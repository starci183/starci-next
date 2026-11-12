import { Button, Cluster, EmptyNotice, Stack, SurfaceCard, Text, Textarea } from "@starci/grammar/common"
import { AttemptNotice } from "../../leaves/AttemptNotice"
import type { ApplyEvidenceLabels, ApplyEvidenceProps, EvidenceResult } from "./types"

export type { ApplyEvidenceLabels, EvidenceCriterion, EvidenceResult } from "./types"

/** The tone of a graded level. */
const toneOf = (level: number): "success" | "warning" | "muted" => {
    if (level >= 2) return "success"
    return level === 1 ? "warning" : "muted"
}

/** The label of the submit button from where the attempt stands. */
const submitLabelOf = (props: Pick<ApplyEvidenceProps, "status" | "isSendFailed" | "labels">): string => {
    if (props.status === "pending" || props.status === "grading") return props.labels.pending
    return props.status === "failed" || props.isSendFailed ? props.labels.retry : props.labels.submit
}

/** The words the attempt notice needs, from the labels of the card. */
const noticeWordsOf = (labels: ApplyEvidenceLabels) => ({
    saved: labels.saved,
    grading: labels.grading,
    failedSaved: labels.failedSaved,
    error: labels.error,
    premium: labels.premium,
    plansLabel: labels.plans,
})

/** What the result card needs. */
type ResultCardProps = { readonly result: EvidenceResult; readonly labels: ApplyEvidenceLabels }

/** The result card: a level badge and the missing line per criterion, and the saved-at time under them. */
const ResultCard = (props: ResultCardProps) => (
    <SurfaceCard
        kind="list"
        label={`${props.labels.result} · ${props.result.scoreLine}`}
        empty={props.labels.result}
        footers={[
            {
                kind: "custom",
                children: (
                    <Text size="xs" tone="muted">
                        {props.labels.savedAt.replace("{time}", props.result.savedAt)}
                    </Text>
                ),
            },
        ]}
        items={props.result.criteria.map((each) => ({
            id: each.id,
            title: each.criterion,
            ...(each.missing === "" ? {} : { description: `${props.labels.missing}: ${each.missing}` }),
            badges: [
                { label: props.labels.levels[Math.min(2, Math.max(0, each.level))] ?? "", tone: toneOf(each.level) },
            ],
        }))}
    />
)

/** What the fields need of the card. */
type FieldsProps = Omit<ApplyEvidenceProps, "issue" | "result" | "onSubmit"> & { readonly isPending: boolean }

/** The task and its two labelled fields, with the attempt notice. */
const Fields = (props: FieldsProps) => (
    <Stack gap="row">
        <Text>{props.task}</Text>
        <Textarea
            label={props.labels.output}
            description={props.labels.outputHint}
            name="evidence-output"
            rows={4}
            value={props.outputValue}
            isDisabled={props.isPending}
            onValueChange={props.onOutputChange}
        />
        <Textarea
            label={props.labels.explanation}
            description={props.labels.explanationHint}
            name="evidence-explanation"
            rows={4}
            value={props.explanationValue}
            isDisabled={props.isPending}
            onValueChange={props.onExplanationChange}
        />
        <AttemptNotice
            status={props.status}
            isSendFailed={props.isSendFailed}
            plansHref={props.plansHref}
            {...noticeWordsOf(props.labels)}
        />
    </Stack>
)

/**
 * The evidence card of an exercise: the task, a labelled field for the output of the red test, a labelled explanation, a
 * neutral submit, and under it the result card (a level badge per criterion, the missing line when not full, the saved-at
 * time). It holds no answer of its own and calls no door.
 */
export const ApplyEvidence = (props: ApplyEvidenceProps) => {
    const isPending = props.status === "pending" || props.status === "grading"
    const isSettled = props.status === "saved" || props.status === "graded"
    const isEmpty = props.outputValue.trim() === "" || props.explanationValue.trim() === ""
    if (props.status === "premium") {
        return (
            <SurfaceCard ariaLabel={props.task}>
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
                ariaLabel={props.task}
                footers={[
                    {
                        kind: "custom",
                        children: (
                            <Cluster gap="inline" justify="end">
                                <Button
                                    intent="neutral"
                                    isPending={isPending}
                                    isDisabled={isEmpty || isSettled || props.issue === "limit"}
                                    onPress={props.onSubmit}
                                >
                                    {submitLabelOf(props)}
                                </Button>
                            </Cluster>
                        ),
                    },
                ]}
            >
                <Fields
                    task={props.task}
                    outputValue={props.outputValue}
                    explanationValue={props.explanationValue}
                    status={props.status}
                    isSendFailed={props.isSendFailed}
                    labels={props.labels}
                    plansHref={props.plansHref}
                    onOutputChange={props.onOutputChange}
                    onExplanationChange={props.onExplanationChange}
                    isPending={isPending}
                />
            </SurfaceCard>
            {props.result === undefined ? null : <ResultCard result={props.result} labels={props.labels} />}
        </Stack>
    )
}
