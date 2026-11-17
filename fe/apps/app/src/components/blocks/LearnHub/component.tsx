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
    todayTitle: "xxxxxxxxxxxxxxxx",
    today: [1, 2, 3].map((index) => ({
        id: `p-${index}`,
        title: "xxxxxxxxxxxx",
        shard: "essentials",
        part: "xxxxxx",
        href: "/",
    })),
    streak: {
        currentFigure: "0",
        currentUnit: "xxxxxxxxxx",
        line: "xxxxxxxxxxxxxxxxxxxx",
        weekTitle: "xxxxxxxxxx",
        weekLabel: "xxxxxx",
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
const HubWell = (props: WellProps) => (
    <Stack gap="region">
        <HubPathCard
            view={props.view.path}
            labels={props.props.labels.path}
            chooseHref={props.props.links.chooseHref}
            continueHref={props.props.links.continueHref}
            isLoading={props.isLoading}
        />
        <HubTodayCard
            label={props.props.labels.todayLabel}
            count={props.view.today.length}
            summary={props.view.todayTitle}
            rows={props.view.today}
            emptyLabel={props.props.labels.todayEmpty}
            isLoading={props.isLoading}
        />
    </Stack>
)

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

/** What the aside draws: the settled hub, the placeholder while the first read runs, nothing when the read failed or was refused (the well says why). */
const railViewOf = (props: LearnHubBaseProps["props"]): { view: HubScreenView; isLoading: boolean } | undefined => {
    if ("items" in props.slot) return { view: props.slot.items, isLoading: false }
    if ("isLoading" in props.slot) return { view: props.placeholder, isLoading: true }
    return undefined
}

/**
 * Draws the learn hub the way the approved page is drawn: the white band (title, the 12 muted sublabel, the guide), the well with the
 * active path and today as two separate cards, and the white aside with the streak, the weekly goal and the experience. Data status
 * (loading, empty, error with retry, signed out) belongs to the slot.
 */
export const LearnHubBase = (props: LearnHubBaseProps) => {
    const rail = railViewOf(props.props)
    return (
        <Page
            chrome="panes"
            layout="workspace"
            header={{
                breadcrumbs: "root",
                title: props.props.labels.pageTitle,
                description: props.props.labels.pageDescription,
                actions: (
                    <Guide
                        labels={props.props.labels.guide}
                        isOpen={props.props.isGuideOpen}
                        onOpenChange={props.on.guideOpenChange}
                    />
                ),
            }}
        >
            <PaneGrid
                label={props.props.labels.pageTitle}
                areas={{ base: ["aside", "main"], wide: ["main aside"] }}
                columns={{ base: ["fill"], wide: ["fill", "standard"] }}
                rows={{ base: ["auto", "fill"], wide: ["fill"] }}
            >
                <Pane area="main" scroll label={props.props.labels.pageTitle} content="cards">
                    <PaneSection>
                        <SlotView
                            slot={props.props.slot}
                            placeholder={props.props.placeholder}
                            labels={{ ...props.props.slotLabels, forbidden: props.props.labels.signedOut.title }}
                            forbiddenDescription={props.props.labels.signedOut.body}
                            forbiddenAction={<SignInAction labels={props.props.labels} links={props.props.links} />}
                            onRetry={props.on.retry}
                            render={(view, isLoading) => (
                                <HubWell view={view} isLoading={isLoading} props={props.props} />
                            )}
                        />
                    </PaneSection>
                </Pane>
                <Pane area="aside" surface scroll label={props.props.labels.streak.title}>
                    {rail === undefined ? null : (
                        <PaneSection>
                            <HubRail view={rail.view} isLoading={rail.isLoading} props={props.props} on={props.on} />
                        </PaneSection>
                    )}
                </Pane>
            </PaneGrid>
        </Page>
    )
}
