import { Button, Cluster, Select, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import type { ReviewerChoice } from "../AppointReviewerCard"

/** The words of the reassign form. */
export type AssignItemLabels = {
    readonly title: string
    readonly reviewerLabel: string
    readonly hint: string
    readonly submit: string
}

/** Props for {@link AssignItemCard}. */
export type AssignItemCardProps = {
    readonly labels: AssignItemLabels
    /** The teacher's queue first, then every active reviewer. */
    readonly choices: ReadonlyArray<ReviewerChoice>
    readonly selected: string
    /** The reviewers are still being read: the choices are not settled yet. */
    readonly isLoading: boolean
    readonly isWorking: boolean
    readonly on: { readonly select: (id: string) => void; readonly submit: () => void }
}

/** The teacher's reassign form under a pending item: the teacher's queue or one active reviewer. */
export const AssignItemCard = (props: AssignItemCardProps) => (
    <SurfaceCard label={props.labels.title}>
        <Stack gap="row">
            <Select
                label={props.labels.reviewerLabel}
                options={props.choices}
                value={props.selected}
                isLoading={props.isLoading}
                onValueChange={(id) => props.on.select(id ?? "")}
            />
            <Cluster gap="inline" wrap align="center">
                <Button intent="alternative" isPending={props.isWorking} onPress={props.on.submit}>
                    {props.labels.submit}
                </Button>
                <Text size="sm" tone="muted">
                    {props.labels.hint}
                </Text>
            </Cluster>
        </Stack>
    </SurfaceCard>
)
