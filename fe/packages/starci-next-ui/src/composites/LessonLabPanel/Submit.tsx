import { Alert, Badge, Button, Cluster, Stack, Text } from "@starci/grammar/common"
import type { LabSubmissionView, LabSubmitLabels, LabSubmitView, LessonLabActions } from "./types"

/** What the submit strip needs: the command, the newest submission and whether the solution opens. */
type LabSubmitProps = {
    readonly submit: LabSubmitView
    readonly submission: LabSubmissionView | undefined
    readonly hasSolution: boolean
    readonly labels: LabSubmitLabels
    readonly on: Pick<LessonLabActions, "submit" | "openSolution">
}

/** The Alert tone of a graded outcome. */
const toneOf = (outcome: LabSubmissionView["outcome"]) => {
    if (outcome === "passed") return "affirmative" as const
    return outcome === "waiting" ? ("informative" as const) : ("negative" as const)
}

/** The newest submission: where it was graded, whether it passed or which hidden tests did not, and the solution once it opens. */
const Submission = (
    props: Required<Pick<LabSubmitProps, "labels" | "on" | "hasSolution">> & {
        readonly submission: LabSubmissionView
    },
) => {
    const { submission, labels } = props
    return (
        <Stack gap="identity">
            <Badge tone="muted">{labels.graded}</Badge>
            <Alert
                tone={toneOf(submission.outcome)}
                title={submission.title}
                description={
                    <Stack gap="identity">
                        {submission.description === "" ? null : <Text>{submission.description}</Text>}
                        {submission.failedIds.length === 0 ? null : (
                            <Text>{`${labels.failedHidden} ${submission.failedIds.join(", ")}`}</Text>
                        )}
                    </Stack>
                }
                {...(props.hasSolution ? { action: { label: labels.solution, onAction: props.on.openSolution } } : {})}
            />
        </Stack>
    )
}

/**
 * The foot of the ready lab: "Nộp bài" (grey with its reason until every visible test is green) and the newest submission, worded as
 * graded on the learner's own machine.
 */
export const LabSubmit = (props: LabSubmitProps) => {
    const { submit, labels } = props
    return (
        <Stack gap="row">
            <Cluster gap="inline" wrap align="center">
                <Button
                    variant="primary"
                    isDisabled={submit.isDisabled}
                    isPending={submit.isPending}
                    onPress={props.on.submit}
                >
                    {labels.submit}
                </Button>
                {submit.reason === "" ? null : (
                    <Text role="body" tone="muted">
                        {submit.reason}
                    </Text>
                )}
            </Cluster>
            {props.submission === undefined ? null : (
                <Submission
                    submission={props.submission}
                    labels={labels}
                    on={props.on}
                    hasSolution={props.hasSolution}
                />
            )}
        </Stack>
    )
}
