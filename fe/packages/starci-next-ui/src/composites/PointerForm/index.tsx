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

/** What the pointer form needs: the common part and the handlers it calls. */
type PointerFormProps = FormBaseProps & {
    readonly on: {
        readonly write: (conceptId: string, key: keyof ConceptDraftView, value: string) => void
        readonly savePointer: (conceptId: string) => void
    }
}

/** The pointer form: the code location and the endpoint the probes aim at. */
export const PointerForm = (props: PointerFormProps) => {
    const { labels, concept, draft, isBusy } = props
    const write = (field: keyof ConceptDraftView) => (value: string) => props.on.write(concept.id, field, value)
    return (
        <Stack gap="row">
            <Text isStrong>{labels.pointerTitle}</Text>
            <DraftField
                conceptId={concept.id}
                field="location"
                label={labels.location}
                value={draft.location}
                isDisabled={isBusy}
                onWrite={write("location")}
            />
            <DraftField
                conceptId={concept.id}
                field="endpoint"
                label={labels.endpoint}
                value={draft.endpoint}
                isDisabled={isBusy}
                onWrite={write("endpoint")}
            />
            <DraftField
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
