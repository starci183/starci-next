import { Button, Grid, Page, Section, Stack, Tabs } from "@starci/grammar/common"
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
import type { DataSlot, ReviewerRowView, ReviewPanelLabels, ReviewQueueScreenView, SlotLabels } from "@/modules/types"

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
        readonly exitLabel: string
        readonly exitHref: string
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

/** The rail: the rows of the tab. */
const QueueList = (props: QueueListProps) => (
    <Section
        kind="list"
        title={props.labels.listLabel}
        headingLevel={2}
        fact={props.view.count}
        items={props.view.rows.map((row) => ({
            id: row.itemId,
            title: row.title,
            description: row.meta,
            badges: [{ label: row.sla, tone: row.slaTone }],
            onPress: () => props.on.preview(row.itemId),
            ...(row.isSelected ? { edgeTone: "accent" as const } : {}),
        }))}
        empty={props.labels.empty}
    />
)

/** The reviewer appointments the teacher sees on the Reviewers tab. */
const ReviewerList = (props: ReviewerListProps) => (
    <Section
        kind="list"
        title={props.labels.reviewersLabel}
        headingLevel={2}
        items={props.rows.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.meta,
            action: {
                label: props.labels.endReviewer,
                intent: "neutral" as const,
                press: () => props.on.endReviewer(row.id),
            },
            actionPlacement: "end" as const,
        }))}
        empty={props.labels.reviewersEmpty}
    />
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

/** The queue once read: the filter tabs, then the queue grid or the reviewer list. */
const QueueBody = (props: QueueBodyProps) => (
    <Stack gap="region">
        <Tabs
            label={props.base.props.labels.tabsLabel}
            kind="filter"
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
    <Page header={{ title: props.props.labels.title, titleScale: "standard", breadcrumbs: "root" }}>
        <SlotView
            slot={props.props.slot}
            forbiddenAction={
                <Button intent="neutral" href={props.props.exitHref}>
                    {props.props.exitLabel}
                </Button>
            }
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(view) => <QueueBody view={view} base={props} />}
        />
    </Page>
)
