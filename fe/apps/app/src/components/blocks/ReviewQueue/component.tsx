import { Button, Grid, Page, Section, Skeleton, Stack, Tabs, type PageHeaderContent } from "@starci/grammar/common"
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
    /** Names the breadcrumb landmark. */
    readonly crumbLabel: string
    /** The first crumb, back to the profile. */
    readonly crumbProfile: string
    readonly listLabel: string
    /** Names the filter row of the queue list. */
    readonly tabsLabel: string
    /** Names the teacher's view tabs, Queue and Reviewers. */
    readonly viewsLabel: string
    /** The Queue view tab. */
    readonly queueView: string
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
    /** Chooses a filter of the queue, or the Reviewers view. */
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
        /** The summary line under the heading once the queue is read: how many wait and how many are overdue. */
        readonly meta: string | undefined
        readonly labels: ReviewQueueLabels
        readonly panelLabels: ReviewPanelLabels
        /** The chosen filter of the queue, or the Reviewers view. */
        readonly tab: string
        /** The teacher sees the view tabs Queue and Reviewers and the filters Overdue and Unassigned. */
        readonly isTeacher: boolean
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
    readonly tab: string
    readonly on: ReviewQueueActions
    readonly isLoading: boolean
}

/** What the reviewer list draws. */
type ReviewerListProps = {
    readonly rows: ReadonlyArray<ReviewerRowView>
    readonly labels: ReviewQueueLabels
    readonly on: ReviewQueueActions
}

/** What the queue body draws once read. */
type QueueBodyProps = {
    readonly view: ReviewQueueScreenView
    readonly base: ReviewQueueBaseProps
    readonly isLoading: boolean
}

/** The rail: the rows of the chosen filter, under the filter pills when there is more than one filter. */
const QueueList = (props: QueueListProps) => (
    <Section
        kind="list"
        title={props.labels.listLabel}
        headingLevel={2}
        isLoading={props.isLoading}
        fact={props.view.count}
        {...(props.view.tabs.length < 2
            ? {}
            : {
                  filter: (
                      <Tabs
                          label={props.labels.tabsLabel}
                          kind="filter"
                          shape="pill"
                          items={props.view.tabs}
                          selectedKey={props.tab}
                          onSelect={props.on.selectTab}
                      />
                  ),
              })}
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

/** The rail of rows beside the review panel of the chosen row; on a narrow screen the rows come first. */
const QueueGrid = (props: QueueBodyProps) => (
    <Grid
        kind="main-rail"
        railPosition="leading"
        railWidth="wide"
        collapsedOrder="rail-first"
        rail={
            <QueueList
                isLoading={props.isLoading}
                view={props.view}
                labels={props.base.props.labels}
                tab={props.base.props.tab}
                on={props.base.on}
            />
        }
        primary={
            // While the first read loads the panel is bars, not the placeholder item or the "pick an item" notice.
            props.isLoading ? (
                <Skeleton shape="text" lines={8} />
            ) : (
                <Stack gap="section">
                    <ReviewPanel
                        item={props.view.preview}
                        labels={props.base.props.panelLabels}
                        decision={props.base.props.decision}
                        on={props.base.on}
                    />
                    {props.base.props.assign === undefined ? null : <AssignItemCard {...props.base.props.assign} />}
                </Stack>
            )
        }
    />
)

/** The queue once read: the queue grid, or the teacher's appointment form and reviewer list on the Reviewers view. */
const QueueBody = (props: QueueBodyProps) => (
    <Stack gap="region">
        {props.view.reviewers === undefined ? <QueueGrid {...props} /> : null}
        {props.view.reviewers === undefined || props.base.props.appoint === undefined ? null : (
            <AppointReviewerCard {...props.base.props.appoint} />
        )}
        {props.view.reviewers === undefined ? null : (
            <ReviewerList rows={props.view.reviewers} labels={props.base.props.labels} on={props.base.on} />
        )}
    </Stack>
)

/** The view the teacher's Reviewers tab opens; every other tab key is a filter of the Queue view. */
export const REVIEWERS_VIEW = "reviewers"

/** The Queue view tab key, which opens the queue at its first filter. */
export const QUEUE_VIEW = "queue"

/** The band: the trail from the profile, the page title, the summary of the queue once read, and the teacher's view tabs. */
const headerOf = (props: ReviewQueueBaseProps): PageHeaderContent => ({
    title: props.props.labels.title,
    titleScale: "standard",
    breadcrumbs: {
        label: props.props.labels.crumbLabel,
        items: [
            { id: "profile", label: props.props.labels.crumbProfile, href: props.props.exitHref },
            { id: "queue", label: props.props.labels.title },
        ],
    },
    ...(props.props.meta === undefined ? {} : { meta: props.props.meta }),
    ...(props.props.isTeacher
        ? {
              tabs: {
                  label: props.props.labels.viewsLabel,
                  kind: "views" as const,
                  items: [
                      { id: QUEUE_VIEW, label: props.props.labels.queueView },
                      { id: REVIEWERS_VIEW, label: props.props.labels.reviewersLabel },
                  ],
                  selectedKey: props.props.tab === REVIEWERS_VIEW ? REVIEWERS_VIEW : QUEUE_VIEW,
                  onSelect: props.on.selectTab,
              },
          }
        : {}),
})

/**
 * Draws Experience review the way the canvas does (Program screen queue): for the teacher the view tabs Queue and Reviewers in the
 * band and the filter pills Waiting, Overdue and Unassigned over the list; the rows with their SLA badges, and the review panel of the chosen row. A reader with no signer
 * role gets the forbidden slot.
 */
export const ReviewQueueBase = (props: ReviewQueueBaseProps) => (
    <SlotView
        slot={props.props.slot}
        forbiddenAction={
            <Stack gap="row" align="center">
                <Button intent="neutral" href={props.props.exitHref}>
                    {props.props.exitLabel}
                </Button>
            </Stack>
        }
        placeholder={props.props.placeholder}
        labels={props.props.slotLabels}
        onRetry={props.on.retry}
        render={(view, isLoading) => <QueueBody view={view} base={props} isLoading={isLoading} />}
        frame={({ body, isLoading }) => (
            <Page isLoading={isLoading} header={headerOf(props)}>
                {body}
            </Page>
        )}
    />
)
