import {
    Button,
    EmptyNotice,
    Grid,
    Page,
    Section,
    Skeleton,
    Stack,
    Tabs,
    type PageHeaderContent,
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
import type { DataSlot, ReviewerRowView, ReviewPanelLabels, ReviewQueueScreenView, SlotLabels } from "@/modules/types"
import { ReviewPanelSkeleton } from "../ReviewItem/skeleton"

/** The queue SlotView hands the render while the first read loads; the render draws {@link QueueSkeleton} instead, so it holds no words. */
export const REVIEW_QUEUE_PLACEHOLDER: ReviewQueueScreenView = {
    count: "",
    tabs: [],
    rows: [],
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
    /** The empty queue's notice: nothing waits, and where new items come from. */
    readonly emptyTitle: string
    readonly emptyText: string
    /** The teacher's way on from an empty queue: the Reviewers view. */
    readonly toReviewers: string
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
    /** The teacher's empty queue leads to the Reviewers view, a reviewer's back to the profile. */
    readonly isTeacher: boolean
    readonly exitLabel: string
    readonly exitHref: string
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
}

/** The rail: the rows of the chosen filter, under the filter pills when there is more than one filter. */
const QueueList = (props: QueueListProps) => (
    <Section
        kind="list"
        title={props.labels.listLabel}
        headingLevel={2}
        {...(props.view.rows.length === 0 ? {} : { fact: props.view.count })}
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
        empty={
            <EmptyNotice
                message={props.labels.emptyTitle}
                description={props.labels.emptyText}
                actionIntent="neutral"
                {...(props.isTeacher
                    ? {
                          actionLabel: props.labels.toReviewers,
                          onAction: () => props.on.selectTab(REVIEWERS_VIEW),
                      }
                    : { actionLabel: props.exitLabel, actionHref: props.exitHref })}
            />
        }
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
            // A list row's action is a small button; the end of an appointment is the standard 40px button, so it is the row's control.
            control: (
                <Button intent="neutral" onPress={() => props.on.endReviewer(row.id)}>
                    {props.labels.endReviewer}
                </Button>
            ),
        }))}
        empty={props.labels.reviewersEmpty}
    />
)

/** One queue row while it loads: the item's line, then its learner and part, then its deadline badge. */
const RowSkeleton = () => (
    <Stack gap="row">
        <Skeleton shape="text" lines={3} />
        <Skeleton shape="text" lines={1} />
    </Stack>
)

/**
 * The queue while its first read loads, in the ready grid so nothing jumps: the list heading, the teacher's filter row and three
 * rows in the rail, the review panel beside them. No heading, filter word, badge or tone, only Skeleton bars.
 */
const QueueSkeleton = (props: { readonly isTeacher: boolean }) => (
    <Grid
        kind="main-rail"
        railPosition="leading"
        railWidth="wide"
        collapsedOrder="rail-first"
        rail={
            <Stack gap="row">
                <Skeleton shape="text" lines={1} />
                {props.isTeacher ? <Skeleton shape="text" lines={1} /> : null}
                <Stack gap="region">
                    <RowSkeleton />
                    <RowSkeleton />
                    <RowSkeleton />
                </Stack>
            </Stack>
        }
        primary={<ReviewPanelSkeleton />}
    />
)

/** What the list draws from the queue's props. */
const queueListOf = (props: QueueBodyProps) => (
    <QueueList
        view={props.view}
        labels={props.base.props.labels}
        tab={props.base.props.tab}
        on={props.base.on}
        isTeacher={props.base.props.isTeacher}
        exitLabel={props.base.props.exitLabel}
        exitHref={props.base.props.exitHref}
    />
)

/**
 * The rail of rows beside the review panel of the chosen row; on a narrow screen the rows come first. An empty queue is the list
 * alone with its notice: there is no item to preview, so no panel.
 */
const QueueGrid = (props: QueueBodyProps) =>
    props.view.rows.length === 0 ? (
        queueListOf(props)
    ) : (
        <Grid
            kind="main-rail"
            railPosition="leading"
            railWidth="wide"
            collapsedOrder="rail-first"
            rail={queueListOf(props)}
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
const headerOf = (props: ReviewQueueBaseProps, isLoading: boolean): PageHeaderContent => ({
    title: props.props.labels.title,
    titleScale: "standard",
    breadcrumbs: {
        label: props.props.labels.crumbLabel,
        items: [
            { id: "profile", label: props.props.labels.crumbProfile, href: props.props.exitHref },
            { id: "queue", label: props.props.labels.title },
        ],
    },
    // While loading only the count line is a bar (the title is a fixed label and stays real), so the band does not grow when the queue arrives.
    ...(isLoading
        ? { meta: <Skeleton shape="text" lines={1} /> }
        : props.props.meta === undefined
          ? {}
          : { meta: props.props.meta }),
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
        render={(view, isLoading) =>
            // While the first read loads the content is a skeleton of the ready grid: no heading, filter, row word or panel.
            isLoading ? <QueueSkeleton isTeacher={props.props.isTeacher} /> : <QueueBody view={view} base={props} />
        }
        frame={({ body, isLoading }) => <Page header={headerOf(props, isLoading)}>{body}</Page>}
    />
)
