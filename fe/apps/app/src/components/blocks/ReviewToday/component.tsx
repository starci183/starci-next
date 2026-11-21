import { Skeleton } from "@heroui/react"
import {
    Badge,
    BarChart,
    Button,
    Cluster,
    ChoiceChips,
    Dialog,
    EmptyNotice,
    Grid,
    Link,
    NumberField,
    Page,
    Progress,
    Section,
    Stack,
    Text,
    type ListRowData,
    type PageHeaderContent,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import { SkeletonBlock, SkeletonRows } from "../LoadingShapes"
import type { ReviewHubScreen, ReviewHubView } from "@/hooks/reviewHub"

/** Props for {@link ReviewTodayBase}: the resolved screen of the day. */
export type ReviewTodayBaseProps = {
    readonly props: ReviewHubScreen["props"]
    readonly on: ReviewHubScreen["on"]
}

/** What a piece needs: the screen, the day and whether it is a skeleton. */
type PieceProps = {
    readonly screen: ReviewTodayBaseProps
    readonly view: ReviewHubView
    readonly isLoading: boolean
}

/** The command of the header: start the cards, or the neutral way on. */
const HeaderAction = (props: { readonly primary: NonNullable<ReviewHubScreen["props"]["header"]["primary"]> }) => (
    <Button intent={props.primary.intent} href={props.primary.href}>
        {props.primary.label}
    </Button>
)

/** The next cards as one flat list; a day with nothing due says so and points to the next step. */
const Queue = (props: PieceProps) => {
    const { labels } = props.screen.props
    const { view } = props
    const rows: ReadonlyArray<ListRowData> = view.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        badges: [{ label: row.badge, tone: row.tone }],
    }))
    if (view.state === "done" || view.state === "nothing") {
        const isDone = view.state === "done"
        return (
            <Section title={labels.listTitle} headingLevel={2} isLoading={props.isLoading}>
                <EmptyNotice
                    message={isDone ? labels.doneTitle : labels.nothingTitle}
                    description={isDone ? labels.doneBody : labels.nothingBody}
                    {...(isDone ? {} : { actionLabel: labels.nothingAction, actionHref: "/essentials" })}
                    frame="frameless"
                />
            </Section>
        )
    }
    return (
        <Section
            kind="list"
            title={labels.listTitle}
            headingLevel={2}
            count={view.total}
            isLoading={props.isLoading}
            items={rows}
            empty={labels.nothingTitle}
            caption={view.total > view.rows.length ? view.moreLine : labels.listLabel}
        />
    )
}

/** The chart of how much the learner remembers by the number of the review, with its one sentence. */
const Recall = (props: PieceProps) => {
    const { labels } = props.screen.props
    return (
        <Section title={labels.recallTitle} headingLevel={2} isLoading={props.isLoading}>
            <Stack gap="row">
                <BarChart
                    label={labels.recallLabel}
                    bars={props.view.bars}
                    empty={labels.recallEmpty}
                    isLoading={props.isLoading}
                />
                <Text size="xs" tone="muted">
                    {labels.recallNote}
                </Text>
            </Stack>
        </Section>
    )
}

/** The first visit: how review works and the goal to pick. */
const First = (props: PieceProps) => {
    const { labels, goalOptions, goalChoice } = props.screen.props
    return (
        <Stack gap="region">
            <Section title={labels.howTitle} headingLevel={2} isLoading={props.isLoading}>
                <Text as="p">{labels.howBody}</Text>
            </Section>
            <Section title={labels.goalFirstTitle} headingLevel={2} isLoading={props.isLoading}>
                <Stack gap="row">
                    <ChoiceChips
                        label={labels.goalOptionsLabel}
                        isLabelHidden
                        options={goalOptions.filter((option) => option.value !== "other")}
                        value={goalChoice}
                        onValueChange={props.screen.on.quickGoal}
                        empty={labels.goalFirstTitle}
                    />
                    <Text size="xs" tone="muted">
                        {labels.goalFirstNote}
                    </Text>
                </Stack>
            </Section>
        </Stack>
    )
}

/** The right column: the daily goal with its dialog and the decks of the learner. */
const Rail = (props: PieceProps) => {
    const { labels } = props.screen.props
    const { view } = props
    return (
        <Stack gap="region">
            {view.state === "first" ? null : (
                <Section title={labels.goalTitle} headingLevel={2} isLoading={props.isLoading}>
                    <Stack gap="row">
                        <Cluster gap="inline" justify="between" align="center" wrap>
                            <Text isStrong isLoading={props.isLoading}>
                                {view.goalLine}
                            </Text>
                            <Button intent="neutral" onPress={props.screen.on.openGoal} isDisabled={props.isLoading}>
                                {labels.goalChange}
                            </Button>
                        </Cluster>
                        <Progress label={labels.goalTitle} value={view.goalPercent} isLoading={props.isLoading} />
                        <Text size="xs" tone="muted" isLoading={props.isLoading}>
                            {view.streakLine}
                        </Text>
                    </Stack>
                </Section>
            )}
            <Section
                kind="list"
                title={labels.decksTitle}
                headingLevel={2}
                count={view.decks.length}
                isLoading={props.isLoading}
                // With no deck yet the way to add one is the empty notice's own command, so the head carries no second link.
                {...(view.decks.length === 0 && !props.isLoading
                    ? {}
                    : {
                          action: (
                              <Link variant="head" href={props.screen.props.decksHref}>
                                  {labels.decksManage}
                              </Link>
                          ),
                      })}
                items={view.decks.map((deck) => ({
                    id: deck.id,
                    title: deck.title,
                    description: deck.description,
                    href: deck.href,
                }))}
                empty={
                    <EmptyNotice
                        message={labels.decksEmpty}
                        actionLabel={labels.decksAddFirst}
                        actionHref={props.screen.props.decksHref}
                        frame="frameless"
                    />
                }
            />
        </Stack>
    )
}

/** The dialog that changes the daily goal. */
const GoalDialog = (props: ReviewTodayBaseProps) => {
    const { labels, goalOptions, goalChoice, goalCustom, isGoalOpen, isGoalSaving, isGoalFailed } = props.props
    return (
        <Dialog
            title={labels.dialogTitle}
            description={labels.dialogBody}
            isOpen={isGoalOpen}
            onOpenChange={(isOpen) => {
                if (!isOpen) props.on.closeGoal()
            }}
            footer={
                <>
                    <Button intent="dismiss" onPress={props.on.closeGoal}>
                        {labels.dialogCancel}
                    </Button>
                    <Button intent="commit" isPending={isGoalSaving} onPress={props.on.saveGoal}>
                        {labels.dialogSave}
                    </Button>
                </>
            }
        >
            <Stack gap="row">
                <ChoiceChips
                    label={labels.goalOptionsLabel}
                    isLabelHidden
                    options={goalOptions}
                    value={goalChoice}
                    onValueChange={props.on.chooseGoal}
                    empty={labels.dialogTitle}
                />
                {goalChoice === "other" ? (
                    <NumberField
                        label={labels.dialogOtherLabel}
                        value={goalCustom}
                        minValue={0}
                        maxValue={50}
                        onValueChange={props.on.setCustom}
                    />
                ) : null}
                {isGoalFailed ? <Badge tone="danger">{labels.saveFailed}</Badge> : null}
            </Stack>
        </Dialog>
    )
}

/** The day while its first read loads: the figures strip, the card rows and the chart, the goal and the decks as bars. */
const TodaySkeleton = () => (
    <Stack gap="region">
        <Skeleton className="h-4 w-2/3 rounded-md" />
        <Grid
            kind="main-rail"
            primary={
                <Stack gap="region">
                    <SkeletonRows rows={5} />
                    <Stack gap="row">
                        <Skeleton className="h-5 w-40 rounded-md" />
                        <Skeleton className="h-24 w-full rounded-2xl" />
                    </Stack>
                </Stack>
            }
            rail={
                <Stack gap="region">
                    <SkeletonBlock lines={3} />
                    <SkeletonRows rows={3} />
                </Stack>
            }
        />
    </Stack>
)

/**
 * Draws Ôn tập today: the header with the one command (start the due cards), the strip of three numbers, the next cards as a flat list
 * and the recall chart; beside them the daily goal and the decks of the learner. A day with nothing due or already done says so.
 */
export const ReviewTodayBase = (props: ReviewTodayBaseProps) => {
    const { header } = props.props
    const pageHeaderOf = (loading: boolean): PageHeaderContent => ({
        title: header.title,
        titleScale: "standard",
        breadcrumbs: "root",
        meta: loading ? <Skeleton className="h-3 w-56 rounded-md" /> : header.meta,
        ...(header.primary === null || loading ? {} : { actions: <HeaderAction primary={header.primary} /> }),
    })
    return (
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            errorDescription={props.props.labels.errorText}
            onRetry={props.on.retry}
            render={(view, isLoading) => {
                if (isLoading) return <TodaySkeleton />
                const piece: PieceProps = { screen: props, view, isLoading }
                return (
                    <Stack gap="region">
                        {view.state === "first" ? null : (
                            <Section
                                kind="figures"
                                ariaLabel={props.props.labels.figuresLabel}
                                isLoading={isLoading}
                                items={view.figures.map((figure) => ({
                                    id: figure.id,
                                    term: figure.term,
                                    value: figure.value,
                                }))}
                            />
                        )}
                        <Grid
                            kind="main-rail"
                            primary={
                                view.state === "first" ? (
                                    <First {...piece} />
                                ) : (
                                    <Stack gap="region">
                                        <Queue {...piece} />
                                        <Recall {...piece} />
                                    </Stack>
                                )
                            }
                            rail={<Rail {...piece} />}
                        />
                        <GoalDialog {...props} />
                    </Stack>
                )
            }}
            frame={(parts) => <Page header={pageHeaderOf(parts.isLoading)}>{parts.body}</Page>}
        />
    )
}
