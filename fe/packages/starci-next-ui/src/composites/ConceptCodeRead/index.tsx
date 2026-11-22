import {
    Alert,
    Button,
    EmptyNotice,
    Input,
    Section,
    Stack,
    Text,
    Textarea,
    type BadgeTone,
    type ListRowData,
} from "@starci/grammar/common"
import type { ConceptDraftView } from "../ConceptDrawer/types"

/** The fixed words of the code-read part of a concept page. */
export type ConceptCodeReadLabels = {
    readonly codeTitle: string
    readonly comingSoon: string
    readonly pointerTitle: string
    readonly location: string
    readonly endpoint: string
    readonly sampleBody: string
    readonly savePointer: string
    readonly savingPointer: string
    readonly explainTitle: string
    readonly explainText: string
    readonly excerpt: string
    readonly explanation: string
    readonly explain: string
    readonly explaining: string
    readonly rubricTitle: string
    readonly rubricEmpty: string
    /** The hidden heading of the verdict column. */
    readonly ciVerdict: string
}

/** One criterion of the AI rubric: its words and the verdict the teacher gave it. */
export type ConceptRubricRow = {
    readonly id: string
    readonly text: string
    readonly verdict: "met" | "partial" | "missing"
}

/** The tone of a verdict chip. */
const VERDICT_TONE: Readonly<Record<ConceptRubricRow["verdict"], BadgeTone>> = {
    met: "success",
    partial: "warning",
    missing: "danger",
}

/** What the code-read part of a concept needs: the concept's flags, the words, the draft, the rubric and the commands. */
type ConceptCodeReadProps = {
    readonly concept: { readonly id: string; readonly comingSoon: boolean; readonly needsCodeRead: boolean }
    readonly labels: ConceptCodeReadLabels
    readonly draft: ConceptDraftView
    readonly rubric: ReadonlyArray<ConceptRubricRow>
    /** The words of each verdict. */
    readonly verdictLabels: Readonly<Record<ConceptRubricRow["verdict"], string>>
    readonly isBusy: boolean
    readonly isLoading: boolean
    /** The words of the last refusal of a command; empty for none. */
    readonly issueWords: string
    readonly on: {
        readonly write: (key: keyof ConceptDraftView, value: string) => void
        readonly savePointer: () => void
        readonly explain: () => void
    }
}

/** What one field of the forms needs. */
type FieldProps = {
    readonly field: keyof ConceptDraftView
    readonly label: string
    readonly rows?: number
    readonly props: ConceptCodeReadProps
}

/** One field of the concept's forms: a line, or a text area when it has rows. */
const Field = (props: FieldProps) =>
    props.rows === undefined ? (
        <Input
            id={`${props.props.concept.id}-${props.field}`}
            name={props.field}
            label={props.label}
            kind="text"
            value={props.props.draft[props.field]}
            isDisabled={props.props.isBusy}
            onValueChange={(value) => props.props.on.write(props.field, value)}
        />
    ) : (
        <Textarea
            id={`${props.props.concept.id}-${props.field}`}
            name={props.field}
            label={props.label}
            rows={props.rows}
            value={props.props.draft[props.field]}
            isDisabled={props.props.isBusy}
            onValueChange={(value) => props.props.on.write(props.field, value)}
        />
    )

/** The two commands of the part: where the code lives, and the excerpt the AI teacher reads. */
const Forms = (props: ConceptCodeReadProps) => {
    const { labels, isBusy } = props
    return (
        <Stack gap="section">
            <Section title={labels.pointerTitle} headingLevel={3}>
                <Stack gap="inline">
                    <Field field="location" label={labels.location} props={props} />
                    <Field field="endpoint" label={labels.endpoint} props={props} />
                    <Field field="sampleBody" label={labels.sampleBody} props={props} />
                    <Button variant="border" isPending={isBusy} isDisabled={isBusy} onPress={props.on.savePointer}>
                        {isBusy ? labels.savingPointer : labels.savePointer}
                    </Button>
                </Stack>
            </Section>
            {props.concept.needsCodeRead ? (
                <Section title={labels.explainTitle} headingLevel={3}>
                    <Stack gap="inline">
                        <Text tone="muted">{labels.explainText}</Text>
                        <Field field="excerpt" label={labels.excerpt} rows={8} props={props} />
                        <Field field="explanation" label={labels.explanation} rows={3} props={props} />
                        <Button variant="border" isPending={isBusy} isDisabled={isBusy} onPress={props.on.explain}>
                            {isBusy ? labels.explaining : labels.explain}
                        </Button>
                    </Stack>
                </Section>
            ) : null}
        </Stack>
    )
}

/** The AI code read of a concept: the forms that point at the code and send the excerpt, and the rubric the teacher answers with. */
export const ConceptCodeRead = (props: ConceptCodeReadProps) => {
    const { labels } = props
    return (
        <Stack gap="region">
            <Section title={labels.codeTitle} headingLevel={2} isLoading={props.isLoading}>
                <Stack gap="inline">
                    {props.concept.comingSoon ? (
                        <EmptyNotice message={labels.comingSoon} mark="none" frame="frameless" />
                    ) : (
                        <Forms {...props} />
                    )}
                    {props.issueWords === "" ? null : <Alert tone="negative" title={props.issueWords} />}
                </Stack>
            </Section>
            <Section
                kind="list"
                title={labels.rubricTitle}
                headingLevel={2}
                isLoading={props.isLoading}
                items={props.rubric.map((row): ListRowData => ({
                    id: row.id,
                    title: row.text,
                    badges: [{ label: props.verdictLabels[row.verdict], tone: VERDICT_TONE[row.verdict] }],
                }))}
                empty={<EmptyNotice message={labels.rubricEmpty} mark="none" frame="frameless" />}
            />
        </Stack>
    )
}
