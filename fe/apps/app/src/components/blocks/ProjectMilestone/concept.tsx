import { Alert, Badge, Button, Cluster, Input, Link, Stack, Text, Textarea } from "@starci/grammar/common"
import type { ConceptCardView, ConceptDraftView, FailureNoteView, ProjectMilestoneLabels } from "./types"

/** What a form of one concept needs apart from its handlers: the concept, its words and draft, and whether its command runs. */
type FormBaseProps = {
    readonly concept: ConceptCardView
    readonly labels: ProjectMilestoneLabels
    readonly draft: ConceptDraftView
    readonly isBusy: boolean
}

/** What the pointer form needs: the common part and the handlers it calls. */
export type PointerFormProps = FormBaseProps & {
    readonly on: {
        readonly write: (conceptId: string, key: keyof ConceptDraftView, value: string) => void
        readonly savePointer: (conceptId: string) => void
    }
}

/** What the explain form needs: the common part and the handlers it calls. */
export type ExplainFormProps = FormBaseProps & {
    readonly on: {
        readonly write: (conceptId: string, key: keyof ConceptDraftView, value: string) => void
        readonly explain: (conceptId: string) => void
    }
}

/** What one text field of a concept form needs. */
type DraftFieldProps = {
    readonly conceptId: string
    readonly field: keyof ConceptDraftView
    readonly label: string
    readonly value: string
    readonly isDisabled: boolean
    readonly onWrite: (value: string) => void
}

/** What one text area of a concept form needs: a field and its height. */
type DraftAreaProps = DraftFieldProps & { readonly rows: number }

/** What the evidence of a concept needs: the concept and the label of the question. */
type ConceptEvidenceProps = { readonly concept: ConceptCardView; readonly questionLabel: string }

/** What the failure note needs: the failure and the label of the question. */
type FailureProps = { readonly rejection: FailureNoteView; readonly questionLabel: string }

/** One text field of a concept form. */
const DraftInput = (props: DraftFieldProps) => (
    <Input
        id={`concept-${props.conceptId}-${props.field}`}
        name={props.field}
        label={props.label}
        kind="text"
        value={props.value}
        isDisabled={props.isDisabled}
        onValueChange={props.onWrite}
    />
)

/** One text area of a concept form. */
const DraftArea = (props: DraftAreaProps) => (
    <Textarea
        id={`concept-${props.conceptId}-${props.field}`}
        name={props.field}
        label={props.label}
        rows={props.rows}
        value={props.value}
        isDisabled={props.isDisabled}
        onValueChange={props.onWrite}
    />
)

/** What failed in a concept: the reason, the question the AI asked and the lesson to relearn. */
const FailureNote = (props: FailureProps) => {
    const failure = props.rejection
    const description = failure.question === "" ? undefined : `${props.questionLabel}: ${failure.question}`
    return (
        <>
            <Alert tone="negative" title={failure.text} {...(description === undefined ? {} : { description })} />
            <Link href={failure.relearnHref}>{failure.relearnLabel}</Link>
        </>
    )
}

/** The evidence chips of a concept and what failed. */
export const ConceptEvidence = (props: ConceptEvidenceProps) => {
    const { concept } = props
    return (
        <Stack gap="inline">
            <Cluster gap="inline" wrap align="center">
                {concept.chips.map((chip) => (
                    <Badge key={chip.id} tone={chip.tone}>
                        {[chip.label, chip.state, chip.mark].filter((part) => part !== "").join(" · ")}
                    </Badge>
                ))}
            </Cluster>
            {concept.rejection === undefined ? null : (
                <FailureNote rejection={concept.rejection} questionLabel={props.questionLabel} />
            )}
            {concept.rejection !== undefined || concept.aiQuestion === "" ? null : (
                <Text>
                    {props.questionLabel}: {concept.aiQuestion}
                </Text>
            )}
            {concept.rejection === undefined && concept.relearnHref !== "" ? (
                <Link href={concept.relearnHref}>{concept.relearnLabel}</Link>
            ) : null}
        </Stack>
    )
}

/** The pointer form: the code location and the endpoint the probes aim at. */
export const PointerForm = (props: PointerFormProps) => {
    const { labels, concept, draft, isBusy } = props
    const write = (field: keyof ConceptDraftView) => (value: string) => props.on.write(concept.id, field, value)
    return (
        <Stack gap="row">
            <Text isStrong>{labels.pointerTitle}</Text>
            <DraftInput
                conceptId={concept.id}
                field="location"
                label={labels.location}
                value={draft.location}
                isDisabled={isBusy}
                onWrite={write("location")}
            />
            <DraftInput
                conceptId={concept.id}
                field="endpoint"
                label={labels.endpoint}
                value={draft.endpoint}
                isDisabled={isBusy}
                onWrite={write("endpoint")}
            />
            <DraftArea
                conceptId={concept.id}
                field="sampleBody"
                label={labels.sampleBody}
                rows={3}
                value={draft.sampleBody}
                isDisabled={isBusy}
                onWrite={write("sampleBody")}
            />
            <Cluster gap="inline" wrap>
                <Button intent="neutral" isPending={isBusy} onPress={() => props.on.savePointer(concept.id)}>
                    {isBusy ? labels.savingPointer : labels.savePointer}
                </Button>
            </Cluster>
        </Stack>
    )
}

/** The form that asks the AI teacher to read the code the concept points to. */
export const ExplainForm = (props: ExplainFormProps) => {
    const { labels, concept, draft, isBusy } = props
    const write = (field: keyof ConceptDraftView) => (value: string) => props.on.write(concept.id, field, value)
    return (
        <Stack gap="row">
            <Text isStrong>{labels.explainTitle}</Text>
            <Text tone="muted">{labels.explainText}</Text>
            <DraftArea
                conceptId={concept.id}
                field="excerpt"
                label={labels.excerpt}
                rows={8}
                value={draft.excerpt}
                isDisabled={isBusy}
                onWrite={write("excerpt")}
            />
            <DraftArea
                conceptId={concept.id}
                field="explanation"
                label={labels.explanation}
                rows={4}
                value={draft.explanation}
                isDisabled={isBusy}
                onWrite={write("explanation")}
            />
            <Cluster gap="inline" wrap>
                <Button
                    intent="commit"
                    isPending={isBusy}
                    isDisabled={
                        isBusy ||
                        draft.location.trim() === "" ||
                        draft.excerpt.trim() === "" ||
                        draft.explanation.trim() === ""
                    }
                    onPress={() => props.on.explain(concept.id)}
                >
                    {isBusy ? labels.explaining : labels.explain}
                </Button>
            </Cluster>
        </Stack>
    )
}
