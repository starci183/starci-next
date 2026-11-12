import { Button, Cluster, Heading, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import type { ReviewSessionLabels, ReviewSummaryScreen } from "@/modules/types"

/** What the end of the session needs. */
export type ReviewSummaryCardProps = {
    readonly summary: ReviewSummaryScreen
    readonly labels: ReviewSessionLabels
    readonly todayHref: string
    readonly hubHref: string
}

/** What a figure of the summary needs: its caption and value. */
type FigureProps = { readonly caption: string; readonly value: string }

/** One figure of the summary. */
const Figure = (props: FigureProps) => (
    <Stack gap="identity">
        <Text size="sm" tone="muted">
            {props.caption}
        </Text>
        <Heading level={3} scale="standard">
            {props.value}
        </Heading>
    </Stack>
)

/** The end of the session: what was reviewed, the share remembered, the goal, what is left, and the way on. */
export const ReviewSummaryCard = (props: ReviewSummaryCardProps) => (
    <SurfaceCard label={props.labels.summaryTitle}>
        <Stack gap="row">
            <Cluster gap="inline" wrap>
                <Figure caption={props.labels.summaryReviewed} value={props.summary.reviewed} />
                <Figure caption={props.labels.summaryRecall} value={props.summary.recall} />
                {props.summary.goal === undefined ? null : (
                    <Figure caption={props.labels.summaryGoal} value={props.summary.goal} />
                )}
            </Cluster>
            <Text>{props.summary.isAllDone ? props.labels.summaryAllDone : props.summary.remaining}</Text>
            <Cluster gap="inline" wrap>
                <Button intent="commit" href={props.todayHref}>
                    {props.labels.summaryBack}
                </Button>
                <Button intent="alternative" href={props.hubHref}>
                    {props.labels.summaryHub}
                </Button>
            </Cluster>
        </Stack>
    </SurfaceCard>
)
