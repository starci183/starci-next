import { Alert, Button, CheckboxGroup, Cluster, Input, NumberField, Stack, SurfaceCard } from "@starci/grammar/common"

/** One choice of a reviewer form: an id and its words. */
export type ReviewerChoice = { readonly id: string; readonly label: string }

/** What the last reviewer write did, or why it was refused, with its tone. */
export type ReviewerAdminOutcome = { readonly text: string; readonly tone: "affirmative" | "negative" }

/** The words of the appointment form. */
export type AppointReviewerLabels = {
    readonly title: string
    readonly reviewerLabel: string
    readonly reviewerHint: string
    readonly partsLabel: string
    readonly capacityLabel: string
    readonly submit: string
}

/** The values of the appointment form. */
export type AppointReviewerValue = {
    readonly reviewerId: string
    readonly parts: ReadonlyArray<string>
    readonly capacity: number
}

/** Props for {@link AppointReviewerCard}. */
export type AppointReviewerCardProps = {
    readonly labels: AppointReviewerLabels
    readonly parts: ReadonlyArray<ReviewerChoice>
    readonly value: AppointReviewerValue
    readonly isWorking: boolean
    readonly outcome: ReviewerAdminOutcome | undefined
    readonly on: {
        readonly changeReviewer: (value: string) => void
        readonly changeParts: (value: ReadonlyArray<string>) => void
        readonly changeCapacity: (value: number) => void
        readonly submit: () => void
    }
}

/**
 * The teacher's appointment form on the Reviewers tab: the reviewer's account subject, the parts they may sign and how many
 * items they hold at once. Appointing a subject again replaces its scope.
 */
export const AppointReviewerCard = (props: AppointReviewerCardProps) => (
    <SurfaceCard label={props.labels.title}>
        <Stack gap="row">
            <Input
                id="appoint-reviewer"
                name="reviewerId"
                label={props.labels.reviewerLabel}
                description={props.labels.reviewerHint}
                value={props.value.reviewerId}
                onValueChange={props.on.changeReviewer}
            />
            <CheckboxGroup
                label={props.labels.partsLabel}
                options={props.parts.map((part) => ({ value: part.id, label: part.label }))}
                value={props.value.parts}
                orientation="horizontal"
                onValueChange={props.on.changeParts}
            />
            <NumberField
                label={props.labels.capacityLabel}
                value={props.value.capacity}
                minValue={1}
                maxValue={500}
                onValueChange={props.on.changeCapacity}
            />
            <Cluster gap="inline" align="center">
                <Button intent="commit" isPending={props.isWorking} onPress={props.on.submit}>
                    {props.labels.submit}
                </Button>
            </Cluster>
            {props.outcome === undefined ? null : <Alert tone={props.outcome.tone} title={props.outcome.text} />}
        </Stack>
    </SurfaceCard>
)
