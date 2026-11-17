import {
    Alert,
    Badge,
    Button,
    Cluster,
    DataTable,
    Input,
    Section,
    Stack,
    Text,
    Textarea,
    type BadgeTone,
} from "@starci/grammar/common"
import type { ConceptDraftView, RubricVerdict } from "@/modules/types"
import type { BodyProps, ProjectConceptBaseProps } from "./types"

/** The tone of a rubric verdict. */
const VERDICT_TONE: Readonly<Record<RubricVerdict, BadgeTone>> = { met: "success", partial: "warning", missing: "danger" }

/** What a draft field needs. */
type DraftProps = {
    readonly id: string
    readonly field: keyof ConceptDraftView
    readonly label: string
    readonly rows?: number
    readonly props: ProjectConceptBaseProps
}

/** One field of the concept's forms: a line, or a text area when it has rows. */
const Draft = (props: DraftProps) =>
    props.rows === undefined ? (
        <Input
            id={`${props.id}-${props.field}`}
            name={props.field}
            label={props.label}
            kind="text"
            value={props.props.props.draft[props.field]}
            isDisabled={props.props.props.isBusy}
            onValueChange={(value) => props.props.on.write(props.field, value)}
        />
    ) : (
        <Textarea
            id={`${props.id}-${props.field}`}
            name={props.field}
            label={props.label}
            rows={props.rows}
            value={props.props.props.draft[props.field]}
            isDisabled={props.props.props.isBusy}
            onValueChange={(value) => props.props.on.write(props.field, value)}
        />
    )

/** The AI code read: where the code lives, the excerpt and the explanation to send, and the rubric the teacher answers with. */
export const CodeRead = (props: BodyProps) => {
    const { labels, isBusy } = props.props
    const { concept } = props.view
    return (
        <Section title={labels.codeTitle} headingLevel={2} isLoading={props.isLoading}>
            <Stack gap="row">
                {concept.comingSoon ? <Text tone="muted">{labels.comingSoon}</Text> : null}
                {concept.comingSoon ? null : (
                    <Stack gap="row">
                        <Text isStrong>{labels.pointerTitle}</Text>
                        <Draft id={concept.id} field="location" label={labels.location} props={props} />
                        <Draft id={concept.id} field="endpoint" label={labels.endpoint} props={props} />
                        <Draft id={concept.id} field="sampleBody" label={labels.sampleBody} props={props} />
                        <Cluster gap="inline" wrap>
                            <Button
                                intent="neutral"
                                isPending={isBusy}
                                isDisabled={isBusy}
                                onPress={props.on.savePointer}
                            >
                                {isBusy ? labels.savingPointer : labels.savePointer}
                            </Button>
                        </Cluster>
                    </Stack>
                )}
                {concept.comingSoon || !concept.needsCodeRead ? null : (
                    <Stack gap="row">
                        <Text isStrong>{labels.explainTitle}</Text>
                        <Text size="sm" tone="muted">
                            {labels.explainText}
                        </Text>
                        <Draft id={concept.id} field="excerpt" label={labels.excerpt} rows={8} props={props} />
                        <Draft id={concept.id} field="explanation" label={labels.explanation} rows={3} props={props} />
                        <Cluster gap="inline" wrap>
                            <Button intent="neutral" isPending={isBusy} isDisabled={isBusy} onPress={props.on.explain}>
                                {isBusy ? labels.explaining : labels.explain}
                            </Button>
                        </Cluster>
                    </Stack>
                )}
                {props.props.issueWords === "" ? null : <Alert tone="negative" title={props.props.issueWords} />}
            </Stack>
        </Section>
    )
}

/** The rubric of the code read: a row per criterion with the teacher's verdict. */
export const Rubric = (props: BodyProps) => {
    const { labels } = props.props
    return (
        <Section title={labels.rubricTitle} headingLevel={2} isLoading={props.isLoading}>
            <DataTable
                label={labels.rubricTitle}
                isLoading={props.isLoading}
                phone="table"
                columns={[
                    { id: "criterion", label: labels.rubricTitle, isLabelHidden: true },
                    { id: "verdict", label: labels.ciVerdict, isLabelHidden: true, width: "fit" },
                ]}
                rows={props.view.rubric.map((row) => ({ ...row }))}
                renderCell={(row, columnId) =>
                    columnId === "criterion" ? (
                        row.text
                    ) : (
                        <Badge tone={VERDICT_TONE[row.verdict]}>{labels.verdict[row.verdict]}</Badge>
                    )
                }
                emptyContent={<Text tone="muted">{labels.rubricEmpty}</Text>}
            />
        </Section>
    )
}
