import { Alert, Drawer, Stack, Text } from "@starci/grammar/common"
import { ExplainForm, PointerForm } from "./concept"
import type { ConceptCardView, ConceptDraftView, ProjectMilestoneLabels } from "./types"

/** The draft of a concept the learner has not typed in yet. */
const EMPTY_DRAFT: ConceptDraftView = { location: "", endpoint: "", sampleBody: "", excerpt: "", explanation: "" }

/** What the concept drawer needs: the concept, its words and draft, and the handlers. */
type ConceptDrawerProps = {
    readonly concept: ConceptCardView
    readonly labels: ProjectMilestoneLabels
    /** What the learner typed for the concept; undefined before the first key. */
    readonly draft: ConceptDraftView | undefined
    readonly isBusy: boolean
    /** The words of the last refusal of this concept; empty for none. */
    readonly issueWords: string
    readonly on: {
        readonly write: (conceptId: string, key: keyof ConceptDraftView, value: string) => void
        readonly savePointer: (conceptId: string) => void
        readonly explain: (conceptId: string) => void
        readonly open: (conceptId: string | undefined) => void
    }
}

/** The drawer of one concept: where its code lives and the AI teacher read. */
export const ConceptDrawer = (props: ConceptDrawerProps) => {
    const { concept, labels } = props
    const form = { concept, labels, draft: props.draft ?? EMPTY_DRAFT, isBusy: props.isBusy, on: props.on }
    return (
        <Drawer
            isOpen
            onOpenChange={(isOpen) => (isOpen ? undefined : props.on.open(undefined))}
            title={concept.label}
            description={labels.editTitle}
            closeLabel={labels.closeLabel}
            width="wide"
        >
            <Stack gap="row">
                {concept.comingSoon ? (
                    <Text tone="muted">{labels.comingSoon}</Text>
                ) : (
                    <>
                        {concept.rejection === undefined ? null : (
                            <Alert tone="negative" title={concept.rejection.text} />
                        )}
                        <PointerForm {...form} />
                        {concept.needsCodeRead ? <ExplainForm {...form} /> : null}
                        {props.issueWords === "" ? null : <Alert tone="negative" title={props.issueWords} />}
                    </>
                )}
            </Stack>
        </Drawer>
    )
}
