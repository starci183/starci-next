import { Button, Cluster, Section, Stack, Text } from "@starci/grammar/common"
import type { ReviewSessionLabels, ReviewSummaryScreen } from "../ReviewItemCard/types"

/** What the end of the session needs. */
type ReviewSummaryCardProps = {
    readonly summary: ReviewSummaryScreen
    readonly labels: ReviewSessionLabels
    readonly todayHref: string
}

/** The end of the session: the title with the count, one figure per level, the goal sentence and the way on. */
export const ReviewSummaryCard = (props: ReviewSummaryCardProps) => (
    <Stack gap="region">
        <Section title={props.summary.title} headingLevel={2}>
            <Stack gap="row">
                <Section kind="figures" ariaLabel={props.summary.title} items={props.summary.levels} />
                <Text>{props.summary.line}</Text>
            </Stack>
        </Section>
        <Cluster gap="inline" wrap>
            <Button variant="primary" href={props.todayHref}>
                {props.labels.summaryBack}
            </Button>
            {props.summary.isAllDone ? null : (
                <Button variant="border" href={props.labels.moreHref}>
                    {props.labels.summaryMore}
                </Button>
            )}
        </Cluster>
    </Stack>
)
