import { Button, Cluster, Stack, Text } from "@starci/grammar/common"
import { DraftField } from "../DraftField"
import type { ConceptCardView, ConceptDraftView, ProjectMilestoneLabels } from "../ConceptDrawer/types"

/** What a form of one concept needs apart from its handlers: the concept, its words and draft, and whether its command runs. */
type FormBaseProps = {
    readonly concept: ConceptCardView
    readonly labels: ProjectMilestoneLabels
    readonly draft: ConceptDraftView
    readonly isBusy: boolean
}

/** What the explain form needs: the common part and the handlers it calls. */
type ExplainFormProps = FormBaseProps & {
    readonly on: {
        readonly write: (conceptId: string, key: keyof ConceptDraftView, value: string) => void
        readonly explain: (conceptId: string) => void
    }
}

/** The form that asks the AI teacher to read the code the concept points to. */
export const ExplainForm = (props: ExplainFormProps) => {
    const { labels, concept, draft, isBusy } = props
    const write = (field: keyof ConceptDraftView) => (value: string) => props.on.write(concept.id, field, value)
    return (
        <Stack gap="row">
            <Text isStrong>{labels.explainTitle}</Text>
            <Text tone="muted">{labels.explainText}</Text>
            <DraftField
                conceptId={concept.id}
                field="excerpt"
                label={labels.excerpt}
                rows={8}
                value={draft.excerpt}
                isDisabled={isBusy}
                onWrite={write("excerpt")}
            />
            <DraftField
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
