import { Button, Dialog, Grid, Page, Stack, Text } from "@starci/grammar/common"
import {
    ART,
    ArtBeside,
    ArtImage,
    HubLayerTile,
    HubPathCard,
    HubShardTile,
    HubStreakCard,
    HubTodayCard,
    Icon,
    SlotView,
    TitledGrid,
    type HubGoalEditorLabels,
    type HubGoalEditorState,
    type HubLayerView,
    type HubPathLabels,
    type HubPathView,
    type HubShardLabels,
    type HubShardView,
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
    readonly shards: ReadonlyArray<HubShardView>
    readonly layers: ReadonlyArray<HubLayerView>
}

/** The fake hub with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const HUB_PLACEHOLDER: HubScreenView = {
    path: undefined,
    todayTitle: "xxxxxxxxxxxxxxxx",
    today: [1, 2, 3].map((index) => ({ id: `p-${index}`, title: "xxxxxxxxxxxx", part: "xxxxxx", href: "/" })),
    streak: {
        current: "xxxxxx",
        longest: "xxxxxx",
        freezes: "xxxxxx",
        weekLabel: "xxxxxxxxxx",
        weekPercent: 0,
        days: [1, 2, 3, 4, 5, 6, 7].map((index) => ({
            id: `d-${index}`,
            label: "xx",
            state: "missed" as const,
            title: "xx",
        })),
    },
    shards: [1, 2, 3, 4, 5, 6].map((index) => ({
        id: `s-${index}`,
        stage: "xxxxx",
        title: "xxxxxxxx",
        href: "/",
        next: "xxxxxxxxxxxxxxxx",
        progressLabel: "xxxxxx",
        counter: "xxxxxx",
        isSoon: false,
        verified: undefined,
        pending: undefined,
    })),
    layers: [1, 2, 3].map((index) => ({ id: `l-${index}`, title: "xxxxxxxx", body: "xxxxxxxxxxxx", href: "/" })),
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
    readonly shardsTitle: string
    readonly shardsSubtitle: string
    readonly shard: HubShardLabels
    readonly layersTitle: string
    readonly layersSubtitle: string
    readonly layerOpen: string
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

/** What the today section is given. */
type TodaySectionProps = {
    readonly view: HubScreenView
    readonly labels: HubLabels
    readonly goal: HubGoalEditorState
    readonly onGoalOpenChange: (isOpen: boolean) => void
    readonly onGoalChoose: (value: string) => void
    readonly onGoalSave: () => void
    readonly isLoading: boolean
}

/** Today beside the streak card. */
const TodaySection = (props: TodaySectionProps) => (
    <Grid
        kind="main-rail"
        primary={
            <HubTodayCard
                label={props.labels.todayLabel}
                summary={props.view.todayTitle}
                rows={props.view.today}
                emptyLabel={props.labels.todayEmpty}
                isLoading={props.isLoading}
            />
        }
        rail={
            <HubStreakCard
                view={props.view.streak}
                labels={props.labels.streak}
                goalState={props.goal}
                goalLabels={props.labels.goal}
                onGoalOpenChange={props.onGoalOpenChange}
                onGoalChoose={props.onGoalChoose}
                onGoalSave={props.onGoalSave}
                isLoading={props.isLoading}
            />
        }
        railWidth="medium"
        align="start"
    />
)

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
        trigger={
            <Button intent="neutral" startContent={<Icon />}>
                {props.labels.trigger}
            </Button>
        }
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

/**
 * Draws the learn hub the way the canvas does: the active path (or the invitation to choose a goal), today beside the streak card,
 * the six learning-shard cards, then the three layers apart. Data status (loading, empty, error with retry, signed out) belongs to the slot.
 */
export const LearnHubBase = (props: LearnHubBaseProps) => (
    <Page
        header={{
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
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={{ ...props.props.slotLabels, forbidden: props.props.labels.signedOut.title }}
            forbiddenDescription={props.props.labels.signedOut.body}
            forbiddenAction={<SignInAction labels={props.props.labels} links={props.props.links} />}
            onRetry={props.on.retry}
            render={(view, isLoading) => (
                <Stack gap="region">
                    <ArtBeside art={<ArtImage asset={ART.journey} />}>
                        <HubPathCard
                            view={view.path}
                            labels={props.props.labels.path}
                            chooseHref={props.props.links.chooseHref}
                            continueHref={props.props.links.continueHref}
                            isLoading={isLoading}
                        />
                    </ArtBeside>
                    <TodaySection
                        view={view}
                        labels={props.props.labels}
                        goal={props.props.goal}
                        onGoalOpenChange={props.on.goalOpenChange}
                        onGoalChoose={props.on.goalChoose}
                        onGoalSave={props.on.goalSave}
                        isLoading={isLoading}
                    />
                    <TitledGrid title={props.props.labels.shardsTitle} subtitle={props.props.labels.shardsSubtitle}>
                        {view.shards.map((shard) => (
                            <HubShardTile key={shard.id} shard={shard} labels={props.props.labels.shard} />
                        ))}
                    </TitledGrid>
                    <TitledGrid title={props.props.labels.layersTitle} subtitle={props.props.labels.layersSubtitle}>
                        {view.layers.map((layer) => (
                            <HubLayerTile key={layer.id} layer={layer} openLabel={props.props.labels.layerOpen} />
                        ))}
                    </TitledGrid>
                </Stack>
            )}
        />
    </Page>
)
