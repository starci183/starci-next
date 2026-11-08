import { Button, Cluster, Stack, SurfaceCard, Text, Textarea } from "@starci/grammar/common"

/** The words of the decision cards. */
export type ReviewDecisionLabels = {
    readonly noteLabel: string
    readonly notePlaceholder: string
    readonly approve: string
    readonly giveBack: string
    readonly rules: string
    readonly revokeLabel: string
    readonly revoke: string
}

/** What the last decision did, or why it was refused, with its tone. */
export type ReviewOutcomeView = { readonly text: string; readonly tone: "affirmative" | "cautionary" | "negative" }
/** What the signer does in the panel. */
export type ReviewPanelActions = {
    readonly editNote: (text: string) => void
    readonly approve: () => void
    readonly giveBack: () => void
    readonly revoke: () => void
}

/** The decision state of the panel: the note, whether a write runs and what the last one did. */
export type ReviewPanelDecision = {
    readonly note: string
    readonly isWorking: boolean
    readonly outcome: ReviewOutcomeView | undefined
}

/** What a decision part draws: the words, the decision state and the commands. */
type ReviewActionProps = {
    readonly labels: ReviewDecisionLabels
    readonly decision: ReviewPanelDecision
    readonly on: ReviewPanelActions
}

/** Verify and Return with a note, for an item that waits for a decision. */
const DecideAction = (props: ReviewActionProps) => (
    <SurfaceCard ariaLabel={props.labels.noteLabel}>
        <Stack gap="row">
            <Textarea
                label={props.labels.noteLabel}
                placeholder={props.labels.notePlaceholder}
                value={props.decision.note}
                rows={3}
                onValueChange={props.on.editNote}
            />
            <Cluster gap="inline" wrap align="center">
                <Button intent="commit" isPending={props.decision.isWorking} onPress={props.on.approve}>
                    {props.labels.approve}
                </Button>
                <Button intent="alternative" isPending={props.decision.isWorking} onPress={props.on.giveBack}>
                    {props.labels.giveBack}
                </Button>
            </Cluster>
            <Text size="sm" tone="muted">
                {props.labels.rules}
            </Text>
        </Stack>
    </SurfaceCard>
)

/** Revoke with its reason, for the teacher on a verified item. */
const RevokeAction = (props: ReviewActionProps) => (
    <SurfaceCard ariaLabel={props.labels.revokeLabel}>
        <Stack gap="row">
            <Textarea
                label={props.labels.revokeLabel}
                value={props.decision.note}
                rows={3}
                onValueChange={props.on.editNote}
            />
            <Button intent="destructive" isPending={props.decision.isWorking} onPress={props.on.revoke}>
                {props.labels.revoke}
            </Button>
        </Stack>
    </SurfaceCard>
)

/** Props for {@link ReviewDecisionCard}. */
type ReviewDecisionCardProps = ReviewActionProps & {
    /** The item waits for a decision: Verify and Return with a note. */
    readonly isOpen: boolean
    /** The teacher may revoke the verified item. */
    readonly canRevoke: boolean
}

/** The decision cards of one item under review: Verify and Return with a note while it waits, Revoke for the teacher once verified. */
export const ReviewDecisionCard = (props: ReviewDecisionCardProps) => (
    <Stack gap="section">
        {props.isOpen ? <DecideAction labels={props.labels} decision={props.decision} on={props.on} /> : null}
        {props.canRevoke ? <RevokeAction labels={props.labels} decision={props.decision} on={props.on} /> : null}
    </Stack>
)
