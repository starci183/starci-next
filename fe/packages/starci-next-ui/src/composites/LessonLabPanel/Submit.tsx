import {
    Alert,
    Badge,
    Button,
    Cluster,
    DataTable,
    Heading,
    InlineStatus,
    Section,
    Stack,
    Text,
    type DataTableColumn,
} from "@starci/grammar/common"
import type {
    LabMatrixRowView,
    LabMatrixView,
    LabSubmissionView,
    LabSubmitLabels,
    LabSubmitView,
    LessonLabActions,
} from "./types"

/** What the submit page needs: the matrix, the command, the newest submission and the words. */
type LabSubmitProps = {
    readonly matrix: LabMatrixView | undefined
    readonly submit: LabSubmitView
    readonly submission: LabSubmissionView | undefined
    readonly labels: LabSubmitLabels
    readonly on: Pick<LessonLabActions, "submit">
}

/** The Alert tone of a graded outcome. */
const toneOf = (outcome: LabSubmissionView["outcome"]) => {
    if (outcome === "passed") return "affirmative" as const
    return outcome === "waiting" ? ("informative" as const) : ("negative" as const)
}

/** The hidden grader matrix: a row per step, a column per fault, a cell that says in words whether that fault at that step was survived. */
const Matrix = (props: { readonly matrix: LabMatrixView; readonly labels: LabSubmitLabels }) => {
    const { matrix, labels } = props
    return (
        <Section title={labels.matrix} headingLevel={3} {...(matrix.score === "" ? {} : { fact: matrix.score })}>
            <DataTable
                label={labels.matrix}
                phone="table"
                columns={
                    [
                        { id: "step", label: labels.step, width: "fill", minWidth: 120 },
                        ...matrix.faults.map((fault) => ({ id: fault.id, label: fault.label, width: "fit" as const })),
                    ] satisfies DataTableColumn[]
                }
                rows={matrix.rows}
                emptyContent={labels.matrix}
                renderCell={(row: LabMatrixRowView, column) => {
                    if (column === "step") return row.label
                    const cell = row.cells.find((each) => each.id === `${row.id}-${column}`)
                    return cell === undefined ? "" : <InlineStatus state={cell.state} label={cell.stateLabel} />
                }}
            />
        </Section>
    )
}

/** The newest submission: where it was graded, whether it passed or which hidden cells did not. */
const Submission = (props: { readonly submission: LabSubmissionView; readonly labels: LabSubmitLabels }) => {
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
                        {submission.failed.length === 0 ? null : (
                            <Text>{`${labels.failedHidden} ${submission.failed.join(", ")}`}</Text>
                        )}
                    </Stack>
                }
            />
        </Stack>
    )
}

/**
 * The submit page: the hidden matrix of steps by faults, the grading command (grey with its reason until the visible work is green),
 * the newest submission worded as graded on the learner's own machine. A pass hands over nothing: the comparison with real repositories
 * that follows it is the lesson page's, drawn beneath this panel.
 */
export const LabSubmit = (props: LabSubmitProps) => {
    const { submit, labels } = props
    const isPassed = props.submission?.outcome === "passed"
    return (
        <Stack gap="section">
            <Stack gap="row">
                <Heading level={2}>{labels.title}</Heading>
                <Text tone="muted">{labels.note}</Text>
            </Stack>
            {props.matrix === undefined ? null : <Matrix matrix={props.matrix} labels={labels} />}
            <Stack gap="row">
                <Cluster gap="inline" wrap align="center">
                    <Button
                        variant={isPassed ? "border" : "primary"}
                        isDisabled={submit.isDisabled}
                        isPending={submit.isPending}
                        onPress={props.on.submit}
                    >
                        {isPassed ? labels.resubmit : labels.submit}
                    </Button>
                    {submit.reason === "" ? null : (
                        <Text role="body" tone="muted">
                            {submit.reason}
                        </Text>
                    )}
                </Cluster>
                {props.submission === undefined ? null : <Submission submission={props.submission} labels={labels} />}
            </Stack>
        </Stack>
    )
}
