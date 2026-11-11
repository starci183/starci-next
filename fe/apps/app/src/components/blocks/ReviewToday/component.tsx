import {
    Alert,
    Badge,
    Button,
    Cluster,
    EmptyNotice,
    Grid,
    Heading,
    Link,
    Page,
    ProgressCircle,
    Stack,
    SurfaceCard,
    Text,
} from "@starci/grammar/common"
import { ART, SlotView, UpsellRow } from "@starci-next/ui"
import type { DataSlot, ReviewTodayLabels, ReviewTodayScreen, SlotLabels } from "@/modules/types"

/** The fake screen with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const REVIEW_TODAY_PLACEHOLDER: ReviewTodayScreen = {
    state: "ready",
    goalPercent: 40,
    goalText: "xxxxxxxx",
    dueLine: "xxxxxxxxxxxxxxxx",
    newLine: "xxxxxxxxxxxx",
    splitCards: "xxxxxxxx",
    splitRetrieval: "xxxxxxxx",
    doneBody: "xxxxxxxx",
    lockedBody: undefined,
    canStartNew: false,
    rows: [1, 2, 3].map((index) => ({
        id: `placeholder-${index}`,
        title: "xxxxxxxxxxxxxx",
        meta: "xxxxxxxx",
        badge: "xxxxxx",
        badgeTone: "muted" as const,
        isLocked: false,
    })),
    sourceDeck: "xx",
    sourceLesson: "xx",
}

/** Props for {@link ReviewTodayBase}. */
export type ReviewTodayBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ReviewTodayScreen>
        readonly placeholder: ReviewTodayScreen
        readonly slotLabels: SlotLabels
        readonly labels: ReviewTodayLabels
        readonly sessionHref: string
        readonly decksHref: string
        readonly essentialsHref: string
        readonly plansHref: string
        readonly hubHref: string
    }
    readonly on: { readonly retry: () => void }
}

/** The props of the pieces of the screen: the resolved screen, the shared props and whether it is a skeleton. */
type PieceProps = {
    readonly screen: ReviewTodayScreen
    readonly base: ReviewTodayBaseProps["props"]
    readonly isLoading: boolean
}

/** The state of the day when there is something to review: counts, the split and the way in. */
const Summary = (props: PieceProps) => (
    <SurfaceCard label={props.base.labels.dueTitle} isLoading={props.isLoading}>
        <Stack gap="row">
            <Cluster gap="row" wrap align="center">
                <ProgressCircle label={props.base.labels.goalLabel} value={props.screen.goalPercent} size="lg" />
                <Stack gap="inline">
                    <Text isStrong>{props.base.labels.goalLabel}</Text>
                    <Text tone="muted">{props.screen.goalText}</Text>
                </Stack>
            </Cluster>
            <Text as="p" isStrong>
                {props.screen.dueLine}
            </Text>
            <Cluster gap="inline" wrap>
                <Badge tone="neutral">{props.screen.splitCards}</Badge>
                <Badge tone="accent">{props.screen.splitRetrieval}</Badge>
            </Cluster>
            {props.screen.newLine === undefined ? null : <Text tone="muted">{props.screen.newLine}</Text>}
            <Cluster gap="row" wrap>
                <Button intent="commit" href={props.base.sessionHref}>
                    {props.screen.canStartNew ? props.base.labels.startNew : props.base.labels.start}
                </Button>
                <Button intent="alternative" href={props.base.decksHref}>
                    {props.base.labels.decks}
                </Button>
            </Cluster>
        </Stack>
    </SurfaceCard>
)

/** The card shown when nothing is left: either the goal is met or nothing is due. */
const Rest = (props: PieceProps) => (
    <SurfaceCard
        label={props.screen.state === "done" ? props.base.labels.doneTitle : props.base.labels.emptyTitle}
        isLoading={props.isLoading}
    >
        <Stack gap="row">
            {props.screen.state === "done" ? (
                <Text as="p">{props.screen.doneBody}</Text>
            ) : (
                <EmptyNotice
                    artwork={{ src: ART.remember.src, alt: "", assetSlot: "review-empty" }}
                    message={props.base.labels.emptyTitle}
                    description={props.base.labels.emptyBody}
                />
            )}
            <Cluster gap="row" wrap>
                <Button intent="commit" href={props.base.decksHref}>
                    {props.base.labels.decks}
                </Button>
                <Button intent="alternative" href={props.base.essentialsHref}>
                    {props.base.labels.emptyEssentials}
                </Button>
            </Cluster>
        </Stack>
    </SurfaceCard>
)

/** The queue of the day: every row with where it comes from; locked rows say so. */
const Queue = (props: PieceProps) => (
    <SurfaceCard label={props.base.labels.queueTitle} isLoading={props.isLoading}>
        <Stack gap="row">
            {props.screen.rows.map((row) => (
                <Cluster key={row.id} gap="row" wrap align="center" justify="between">
                    <Stack gap="identity">
                        <Text isStrong overflow="clamp-2">
                            {row.title}
                        </Text>
                        <Text size="sm" tone="muted">
                            {row.isLocked ? props.base.labels.lockedTitle : row.meta}
                        </Text>
                    </Stack>
                    <Badge tone={row.badgeTone}>{row.badge}</Badge>
                </Cluster>
            ))}
        </Stack>
    </SurfaceCard>
)

/** The well: the summary or the rest card, the queue and the Premium notice. */
const Primary = (props: PieceProps) => (
    <Stack gap="region">
        {props.screen.state === "ready" ? <Summary {...props} /> : <Rest {...props} />}
        {props.screen.rows.length === 0 ? null : <Queue {...props} />}
        {props.screen.lockedBody === undefined ? null : (
            <Stack gap="row">
                <Alert tone="informative" title={props.base.labels.lockedTitle} description={props.screen.lockedBody} />
                <UpsellRow
                    label={props.base.labels.upsell}
                    note={props.base.labels.upsellNote}
                    href={props.base.plansHref}
                />
            </Stack>
        )}
    </Stack>
)

/** The aside: where the items come from, and the link to the streak on the Learn page. */
const Rail = (props: PieceProps) => (
    <Stack gap="region">
        <SurfaceCard label={props.base.labels.sourcesTitle} isLoading={props.isLoading}>
            <Stack gap="row">
                <Text>{props.screen.sourceDeck}</Text>
                <Text>{props.screen.sourceLesson}</Text>
            </Stack>
        </SurfaceCard>
        <SurfaceCard ariaLabel={props.base.labels.hubLink} isLoading={props.isLoading}>
            <Stack gap="row">
                <Heading level={3} scale="standard">
                    {props.base.labels.hubLink}
                </Heading>
                <Text size="sm" tone="muted">
                    {props.base.labels.streakNote}
                </Text>
                <Link variant="plain" href={props.base.hubHref}>{props.base.labels.hubLink}</Link>
            </Stack>
        </SurfaceCard>
    </Stack>
)

/** Today's review: the goal ring, what is due, the queue and the way into the session and the decks. */
export const ReviewTodayBase = (props: ReviewTodayBaseProps) => (
    <Page
        header={{ title: props.props.labels.pageTitle, titleScale: "standard", description: props.props.labels.intro }}
    >
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(screen, isLoading) => (
                <Grid
                    kind="main-rail"
                    primary={<Primary screen={screen} base={props.props} isLoading={isLoading} />}
                    rail={<Rail screen={screen} base={props.props} isLoading={isLoading} />}
                />
            )}
        />
    </Page>
)
