import {
    Badge,
    Button,
    Cluster,
    Grid,
    Heading,
    Link,
    Page,
    Stack,
    SurfaceCard,
    Tabs,
    Text,
} from "@starci/grammar/common"
import {
    AppointReviewerCard,
    AssignItemCard,
    ReviewPanel,
    SlotView,
    type AppointReviewerCardProps,
    type AssignItemCardProps,
    type ReviewPanelActions,
    type ReviewPanelDecision,
} from "@starci-next/ui"
import type {
    DataSlot,
    ReviewerRowView,
    ReviewPanelLabels,
    ReviewQueueRowView,
    ReviewQueueScreenView,
    SlotLabels,
} from "@/modules/types"

/** The fake queue with the geometry of a settled one. */
export const REVIEW_QUEUE_PLACEHOLDER: ReviewQueueScreenView = {
    count: "xxxxxx",
    tabs: [{ id: "pending", label: "xxxxxx" }],
    rows: [1, 2, 3].map((index) => ({
        itemId: `placeholder-${index}`,
        title: "xxxxxxxxxx",
        meta: "xxxxxx",
        sla: "xxxxxx",
        slaTone: "neutral" as const,
        href: "",
        isSelected: false,
    })),
    preview: undefined,
    reviewers: undefined,
}

/** The fixed words of the queue. */
export type ReviewQueueLabels = {
    readonly title: string
    readonly listLabel: string
    readonly tabsLabel: string
    readonly reviewersLabel: string
    readonly empty: string
    readonly reviewersEmpty: string
    readonly preview: string
    readonly open: string
    readonly endReviewer: string
}

/** What the signer does on the queue. */
export type ReviewQueueActions = ReviewPanelActions & {
    readonly retry: () => void
    readonly selectTab: (tab: string) => void
    readonly preview: (itemId: string) => void
    readonly endReviewer: (reviewerId: string) => void
}

/** Props for {@link ReviewQueueBase}. */
export type ReviewQueueBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ReviewQueueScreenView>
        readonly placeholder: ReviewQueueScreenView
        readonly slotLabels: SlotLabels
        readonly labels: ReviewQueueLabels
        readonly panelLabels: ReviewPanelLabels
        readonly tab: string
        readonly decision: ReviewPanelDecision
        /** The teacher's appointment form on the Reviewers tab, or undefined for a reviewer. */
        readonly appoint: AppointReviewerCardProps | undefined
        /** The teacher's reassign form under a pending item, or undefined. */
        readonly assign: AssignItemCardProps | undefined
    }
    readonly on: ReviewQueueActions
}

/** What a queue row draws. */
type QueueRowProps = {
    readonly row: ReviewQueueRowView
    readonly labels: ReviewQueueLabels
    readonly on: ReviewQueueActions
}

/** What the queue list draws. */
type QueueListProps = {
    readonly view: ReviewQueueScreenView
    readonly labels: ReviewQueueLabels
    readonly on: ReviewQueueActions
}

/** What the reviewer list draws. */
type ReviewerListProps = {
    readonly rows: ReadonlyArray<ReviewerRowView>
    readonly labels: ReviewQueueLabels
    readonly on: ReviewQueueActions
}

/** What the queue body draws once read. */
type QueueBodyProps = { readonly view: ReviewQueueScreenView; readonly base: ReviewQueueBaseProps }

/** One row: the item, the learner handle and part, the SLA badge, preview and open. */
const QueueRow = (props: QueueRowProps) => (
    <Stack gap="row">
        <Cluster gap="inline" justify="between" align="center">
            <Text isStrong>{props.row.title}</Text>
            <Badge tone={props.row.slaTone}>{props.row.sla}</Badge>
        </Cluster>
        <Text size="sm" tone="muted">
            {props.row.meta}
        </Text>
        <Cluster gap="inline" wrap align="center">
            <Button
                size="sm"
                intent={props.row.isSelected ? "commit" : "neutral"}
                onPress={() => props.on.preview(props.row.itemId)}
            >
                {props.labels.preview}
            </Button>
            <Link variant="plain" href={props.row.href}>
                {props.labels.open}
            </Link>
        </Cluster>
    </Stack>
)

/** The rail: the rows of the tab. */
const QueueList = (props: QueueListProps) => (
    <SurfaceCard label={props.labels.listLabel} note={props.view.count}>
        <Stack gap="row">
            {props.view.rows.length === 0 ? <Text tone="muted">{props.labels.empty}</Text> : null}
            {props.view.rows.map((row) => (
                <QueueRow key={row.itemId} row={row} labels={props.labels} on={props.on} />
            ))}
        </Stack>
    </SurfaceCard>
)

/** The reviewer appointments the teacher sees on the Reviewers tab. */
const ReviewerList = (props: ReviewerListProps) => (
    <SurfaceCard label={props.labels.reviewersLabel}>
        <Stack gap="row">
            {props.rows.length === 0 ? <Text tone="muted">{props.labels.reviewersEmpty}</Text> : null}
            {props.rows.map((row) => (
                <Cluster key={row.id} gap="inline" wrap align="center" justify="between">
                    <Stack gap="identity">
                        <Text isStrong>{row.title}</Text>
                        <Text size="sm" tone="muted">
                            {row.meta}
                        </Text>
                    </Stack>
                    <Button size="sm" intent="neutral" onPress={() => props.on.endReviewer(row.id)}>
                        {props.labels.endReviewer}
                    </Button>
                </Cluster>
            ))}
        </Stack>
    </SurfaceCard>
)

/** The rail of rows beside the review panel of the chosen row. */
const QueueGrid = (props: QueueBodyProps) => (
    <Grid
        kind="main-rail"
        railPosition="leading"
        rail={<QueueList view={props.view} labels={props.base.props.labels} on={props.base.on} />}
        primary={
            <Stack gap="section">
                <ReviewPanel
                    item={props.view.preview}
                    labels={props.base.props.panelLabels}
                    decision={props.base.props.decision}
                    on={props.base.on}
                />
                {props.base.props.assign === undefined ? null : <AssignItemCard {...props.base.props.assign} />}
            </Stack>
        }
    />
)

/** The queue once read: the title, the tabs, then the queue grid or the reviewer list. */
const QueueBody = (props: QueueBodyProps) => (
    <Stack gap="region">
        <Heading level={1} scale="title">
            {props.base.props.labels.title}
        </Heading>
        <Tabs
            label={props.base.props.labels.tabsLabel}
            kind="views"
            items={props.view.tabs}
            selectedKey={props.base.props.tab}
            onSelect={props.base.on.selectTab}
        />
        {props.view.reviewers === undefined ? <QueueGrid {...props} /> : null}
        {props.view.reviewers === undefined || props.base.props.appoint === undefined ? null : (
            <AppointReviewerCard {...props.base.props.appoint} />
        )}
        {props.view.reviewers === undefined ? null : (
            <ReviewerList rows={props.view.reviewers} labels={props.base.props.labels} on={props.base.on} />
        )}
    </Stack>
)

/**
 * Draws Experience review the way the canvas does (Program screen queue): the tabs Waiting, Overdue, Unassigned and Reviewers
 * (the last three for the teacher), the rows with their SLA badges, and the review panel of the chosen row. A reader with no signer
 * role gets the forbidden slot.
 */
export const ReviewQueueBase = (props: ReviewQueueBaseProps) => (
    <Page>
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(view) => <QueueBody view={view} base={props} />}
        />
    </Page>
)
