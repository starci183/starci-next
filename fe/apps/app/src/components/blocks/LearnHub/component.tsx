import { Button, Dialog, Divider, Page, Pane, PaneGrid, PaneSection, Stack, Text } from "@starci/grammar/common"
import {
    HubExperience,
    HubPathCard,
    HubStreakCard,
    HubTodayCard,
    SlotView,
    type HubExperienceView,
    type HubGoalEditorLabels,
    type HubGoalEditorState,
    type HubPathLabels,
    type HubPathView,
    type HubStreakLabels,
    type HubStreakView,
    type HubTodayRow,
} from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"
import { SkeletonBlock } from "@/components/loading/SkeletonBlock"

/** Blank text of the width the skeleton needs: non-breaking spaces carry no readable word into the page or the accessibility tree. */
const blank = (width: number): string => " ".repeat(width)

/** The hub as it is drawn, every word resolved. */
export type HubScreenView = {
    readonly path: HubPathView | undefined
    readonly todayTitle: string
    readonly today: ReadonlyArray<HubTodayRow>
    readonly streak: HubStreakView
    /** The verified and pending experience counts. */
    readonly experience: { readonly verified: number; readonly pending: number }
}

/** The fake hub with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const HUB_PLACEHOLDER: HubScreenView = {
    path: undefined,
    todayTitle: blank(16),
    today: [1, 2, 3].map((index) => ({
        id: `p-${index}`,
        title: blank(12),
        shard: "essentials",
        part: blank(6),
        href: "/",
    })),
    streak: {
        currentFigure: "0",
        currentUnit: blank(10),
        line: blank(20),
        weekTitle: blank(10),
        weekLabel: blank(6),
        weekPercent: 0,
        days: [1, 2, 3, 4, 5, 6, 7].map((index) => ({
            id: `d-${index}`,
            label: "xx",
            state: "missed" as const,
            title: "xx",
        })),
    },
    experience: { verified: 0, pending: 0 },
}

/** The fixed words of the hub. */
export type HubLabels = {
    readonly pageTitle: string
    readonly pageDescription: string
    readonly path: HubPathLabels
    readonly todayLabel: string
    readonly todayEmpty: string
    readonly streak: HubStreakLabels
    readonly goal: HubGoalEditorLabels
    readonly experience: Omit<HubExperienceView, "verified" | "pending">
    /** The words of the guide dialog opened from the page header. */
    readonly guide: {
        readonly trigger: string
        readonly title: string
        readonly description: string
        readonly close: string
    }
    /** The words of a signed-out reader's notice: the reason and the sign-in command. */
    readonly signedOut: { readonly title: string; readonly body: string; readonly action: string }
}

/** Where the hub sends the learner. */
export type HubLinks = {
    readonly chooseHref: string
    readonly continueHref: string
    readonly signInHref: string
}

/** Props for {@link LearnHubBase}. */
export type LearnHubBaseProps = {
    readonly props: {
        readonly slot: DataSlot<HubScreenView>
        readonly placeholder: HubScreenView
        readonly slotLabels: SlotLabels
        readonly labels: HubLabels
        readonly links: HubLinks
        readonly goal: HubGoalEditorState
        readonly isGuideOpen: boolean
    }
    readonly on: {
        readonly retry: () => void
        readonly goalOpenChange: (isOpen: boolean) => void
        readonly goalChoose: (value: string) => void
        readonly goalSave: () => void
        readonly guideOpenChange: (isOpen: boolean) => void
    }
}

/** What the guide dialog is given. */
type GuideProps = {
    readonly labels: HubLabels["guide"]
    readonly isOpen: boolean
    readonly onOpenChange: (isOpen: boolean) => void
}

/** The guide of the home page: a command in the page header that opens a short explanation. */
const Guide = (props: GuideProps) => (
    <Dialog
        isOpen={props.isOpen}
        onOpenChange={props.onOpenChange}
        title={props.labels.title}
        closeLabel={props.labels.close}
        trigger={<Button intent="neutral">{props.labels.trigger}</Button>}
    >
        <Text>{props.labels.description}</Text>
    </Dialog>
)

/** The sign-in command shown to a reader who is not signed in. */
const SignInAction = (props: Pick<LearnHubBaseProps["props"], "labels" | "links">) => (
    <Button intent="commit" href={props.links.signInHref}>
        {props.labels.signedOut.action}
    </Button>
)

/** What the well is drawn from. */
type WellProps = {
    readonly view: HubScreenView
    readonly isLoading: boolean
    readonly props: LearnHubBaseProps["props"]
}

/** The well: the active path (or the invitation to choose a goal), then today as ONE list card; each card names itself on the well above it. */
const HubWell = (props: WellProps) => {
    const path = (
        <HubPathCard
            view={props.view.path}
            labels={props.props.labels.path}
            chooseHref={props.props.links.chooseHref}
            continueHref={props.props.links.continueHref}
            isLoading={props.isLoading}
        />
    )
    const today = (
        <HubTodayCard
            label={props.props.labels.todayLabel}
            count={props.view.today.length}
            summary={props.view.todayTitle}
            rows={props.view.today}
            emptyLabel={props.props.labels.todayEmpty}
            isLoading={props.isLoading}
        />
    )
    /** A learner with no goal yet sees the day's tasks first; the invitation to choose a goal follows them. */
    return <Stack gap="region">{props.view.path === undefined ? [today, path] : [path, today]}</Stack>
}

/** What the aside is drawn from. */
type RailProps = {
    readonly view: HubScreenView
    readonly isLoading: boolean
    readonly props: LearnHubBaseProps["props"]
    readonly on: LearnHubBaseProps["on"]
}

/** The aside pane: the streak, the weekly goal and the experience as sections with a divider between (never floating cards). */
const HubRail = (props: RailProps) => (
    <Stack gap="section">
        <HubStreakCard
            view={props.view.streak}
            labels={props.props.labels.streak}
            goalState={props.props.goal}
            goalLabels={props.props.labels.goal}
            onGoalOpenChange={props.on.goalOpenChange}
            onGoalChoose={props.on.goalChoose}
            onGoalSave={props.on.goalSave}
            isLoading={props.isLoading}
        />
        <Divider semantics="presentation" />
        <HubExperience
            view={{ ...props.props.labels.experience, ...props.view.experience }}
            isLoading={props.isLoading}
        />
    </Stack>
)

/**
 * Draws the learn hub the way the approved page is drawn: the white band (title, the 12 muted sublabel, the guide), the well with the
 * active path and today as two separate cards, and the white aside with the streak, the weekly goal and the experience. Data status
 * (loading, empty, error with retry, signed out) belongs to the slot.
 */
export const LearnHubBase = (props: LearnHubBaseProps) => {
    const own = props.props
    return (
        <SlotView<HubScreenView>
            slot={own.slot}
            placeholder={own.placeholder}
            labels={{ ...own.slotLabels, forbidden: own.labels.signedOut.title }}
            forbiddenDescription={own.labels.signedOut.body}
            forbiddenAction={<SignInAction labels={own.labels} links={own.links} />}
            onRetry={props.on.retry}
            aside={(view, isLoading) => (
                <PaneSection>
                    {isLoading ? (
                        <Stack gap="section">
                            <SkeletonBlock lines={4} />
                            <SkeletonBlock lines={2} />
                            <SkeletonBlock lines={3} />
                        </Stack>
                    ) : (
                        <HubRail view={view} isLoading={isLoading} props={own} on={props.on} />
                    )}
                </PaneSection>
            )}
            frame={({ aside, body }) => (
                <Page
                    chrome="panes"
                    layout="workspace"
                    header={{
                        breadcrumbs: "root",
                        title: own.labels.pageTitle,
                        description: own.labels.pageDescription,
                        actions: (
                            <Guide
                                labels={own.labels.guide}
                                isOpen={own.isGuideOpen}
                                onOpenChange={props.on.guideOpenChange}
                            />
                        ),
                    }}
                >
                    <PaneGrid
                        label={own.labels.pageTitle}
                        areas={{ base: ["main", "aside"], wide: ["main aside"] }}
                        columns={{ base: ["fill"], wide: ["fill", "standard"] }}
                        rows={{ base: ["fill", "auto"], wide: ["fill"] }}
                    >
                        <Pane area="main" scroll label={own.labels.pageTitle} content="cards">
                            <PaneSection>{body}</PaneSection>
                        </Pane>
                        <Pane area="aside" surface scroll label={own.labels.streak.title}>
                            {aside}
                        </Pane>
                    </PaneGrid>
                </Page>
            )}
            render={(view, isLoading) =>
                isLoading ? (
                    <Stack gap="region">
                        <SkeletonBlock lines={5} />
                        <SkeletonBlock lines={6} />
                    </Stack>
                ) : (
                    <HubWell view={view} isLoading={isLoading} props={own} />
                )
            }
        />
    )
}
