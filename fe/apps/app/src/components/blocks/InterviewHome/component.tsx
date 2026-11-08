import { Alert, Button, Cluster, Grid, Page, Select, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { CatalogIntro, LockedNotice, PracticeList, SlotView, type PracticeRow } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** One choice of a select. */
export type InterviewChoice = { readonly id: string; readonly label: string }

/** The session the learner left open, already in words. */
export type InterviewActiveView = {
    readonly sessionId: string
    readonly title: string
    readonly description: string
    readonly href: string
}

/** The home as it is drawn: every word is already resolved. */
export type InterviewHomeView = {
    readonly tracks: ReadonlyArray<InterviewChoice>
    readonly tiers: ReadonlyArray<InterviewChoice>
    readonly languages: ReadonlyArray<InterviewChoice>
    readonly facts: ReadonlyArray<string>
    readonly accessLine: string
    /** True when the free quota is used up and the learner holds no Premium. */
    readonly isLocked: boolean
    readonly lengthLine: string
    readonly banksLine: string
    readonly hasBanks: boolean
    readonly active: InterviewActiveView | null
}

/** The fake home with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const INTERVIEW_HOME_PLACEHOLDER: InterviewHomeView = {
    tracks: [{ id: "placeholder", label: "xxxxxxxx" }],
    tiers: [{ id: "placeholder", label: "xxxxxx" }],
    languages: [{ id: "placeholder", label: "xxxxxx" }],
    facts: ["xxxxxx", "xxxxxxxx"],
    accessLine: "xxxxxxxxxxxx",
    isLocked: false,
    lengthLine: "xxxxxxxxxxxx",
    banksLine: "xxxxxxxxxxxx",
    hasBanks: true,
    active: null,
}

/** The fixed words of the home. */
export type InterviewHomeLabels = {
    readonly eyebrow: string
    readonly title: string
    readonly description: string
    readonly setupTitle: string
    readonly track: string
    readonly tier: string
    readonly language: string
    readonly start: string
    readonly starting: string
    readonly noBanks: string
    readonly lockedTitle: string
    readonly lockedDescription: string
    readonly plans: string
    readonly resume: string
    readonly abandon: string
    readonly historyTitle: string
    readonly historyEmpty: string
    readonly trendTitle: string
}

/** What the learner holds on the home. */
export type InterviewHomeState = {
    readonly track: string
    readonly tier: string
    readonly language: string
    /** The words of the refusal of the last start, or empty. */
    readonly issueWords: string
}

/** What the learner does on the home. */
type InterviewHomeActions = {
    readonly retry: () => void
    readonly track: (id: string) => void
    readonly tier: (id: string) => void
    readonly language: (id: string) => void
    readonly start: () => void
    readonly abandon: (sessionId: string) => void
}

/** The history under the setup, already in words. */
export type InterviewHistoryBlock = {
    readonly slot: DataSlot<{ readonly rows: ReadonlyArray<PracticeRow>; readonly trend: ReadonlyArray<string> }>
    readonly slotLabels: SlotLabels
}

/** Props for {@link InterviewHomeBase}. */
export type InterviewHomeBaseProps = {
    readonly props: {
        readonly slot: DataSlot<InterviewHomeView>
        readonly placeholder: InterviewHomeView
        readonly slotLabels: SlotLabels
        readonly labels: InterviewHomeLabels
        readonly state: InterviewHomeState
        readonly history: InterviewHistoryBlock
        readonly plansHref: string
        /** True while a start is being stored. */
        readonly isStarting: boolean
        /** True while the open session is being abandoned. */
        readonly isAbandoning: boolean
        /** True for a refusal of the last start that Premium would lift. */
        readonly needsPremium: boolean
    }
    readonly on: InterviewHomeActions
}

type SetupProps = {
    readonly view: InterviewHomeView
    readonly props: InterviewHomeBaseProps["props"]
    readonly on: InterviewHomeActions
    readonly isLoading: boolean
}

type ChoiceProps = {
    readonly label: string
    readonly options: ReadonlyArray<InterviewChoice>
    readonly value: string
    readonly onChange: (id: string) => void
}

/** The select of one choice list. */
const Choice = (props: ChoiceProps) => (
    <Select
        label={props.label}
        options={props.options.map((each) => ({ id: each.id, label: each.label }))}
        value={props.value}
        onValueChange={(next) => {
            if (next !== null) props.onChange(next)
        }}
    />
)

/** The setup card: track, tier and language, the length and the bank count, the start and the refusal of the last start. */
const Setup = (props: SetupProps) => {
    const { view, props: p } = props
    const { labels, state } = p
    return (
        <SurfaceCard label={labels.setupTitle}>
            <Stack gap="row">
                <Grid kind="form">
                    <Choice label={labels.track} options={view.tracks} value={state.track} onChange={props.on.track} />
                    <Choice label={labels.tier} options={view.tiers} value={state.tier} onChange={props.on.tier} />
                    <Choice
                        label={labels.language}
                        options={view.languages}
                        value={state.language}
                        onChange={props.on.language}
                    />
                </Grid>
                <Text tone="muted">{view.lengthLine}</Text>
                <Text tone="muted">{view.hasBanks ? view.banksLine : labels.noBanks}</Text>
                {state.issueWords === "" ? null : <Alert tone="negative" title={state.issueWords} />}
                <Cluster gap="inline" wrap align="center">
                    <Button
                        intent="commit"
                        isPending={p.isStarting}
                        isDisabled={view.isLocked || !view.hasBanks || props.isLoading || p.isStarting}
                        onPress={props.on.start}
                    >
                        {p.isStarting ? labels.starting : labels.start}
                    </Button>
                    <Text size="sm" tone="muted">
                        {view.accessLine}
                    </Text>
                </Cluster>
            </Stack>
        </SurfaceCard>
    )
}

type ResumeProps = {
    readonly active: InterviewActiveView
    readonly labels: InterviewHomeLabels
    readonly isBusy: boolean
    readonly onAbandon: (sessionId: string) => void
}

/** The card of a session left open: where to resume it and the way to abandon it. */
const Resume = (props: ResumeProps) => (
    <SurfaceCard treatment="soft" label={props.active.title}>
        <Stack gap="row">
            <Text>{props.active.description}</Text>
            <Cluster gap="inline" wrap>
                <Button intent="commit" href={props.active.href}>
                    {props.labels.resume}
                </Button>
                <Button
                    intent="dismiss"
                    isDisabled={props.isBusy}
                    onPress={() => props.onAbandon(props.active.sessionId)}
                >
                    {props.labels.abandon}
                </Button>
            </Cluster>
        </Stack>
    </SurfaceCard>
)

type HistoryProps = { readonly block: InterviewHistoryBlock; readonly labels: InterviewHomeLabels }

/** The history: the sessions with their score and verdict, and the trend per track and tier. */
const History = (props: HistoryProps) => (
    <SlotView
        slot={props.block.slot}
        placeholder={{ rows: [], trend: [] }}
        labels={props.block.slotLabels}
        forbidden="hide"
        render={(history, isLoading) => (
            <Stack gap="row">
                <PracticeList
                    label={props.labels.historyTitle}
                    emptyLabel={props.labels.historyEmpty}
                    rows={history.rows}
                    isLoading={isLoading}
                />
                {history.trend.length === 0 ? null : (
                    <SurfaceCard label={props.labels.trendTitle}>
                        <Stack gap="inline">
                            {history.trend.map((line) => (
                                <Text key={line} size="sm">
                                    {line}
                                </Text>
                            ))}
                        </Stack>
                    </SurfaceCard>
                )}
            </Stack>
        )}
    />
)

/**
 * Draws the interview home the way the canvas does: the intro, the setup card with the access of the learner, the session left
 * open, then the history with its trend. A learner with no free session left sees the locked notice and the way to Premium.
 */
export const InterviewHomeBase = (props: InterviewHomeBaseProps) => (
    <Page>
        <Stack gap="region">
            <SlotView
                slot={props.props.slot}
                placeholder={props.props.placeholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retry}
                render={(view, isLoading) => (
                    <Stack gap="region">
                        <CatalogIntro
                            eyebrow={props.props.labels.eyebrow}
                            title={props.props.labels.title}
                            description={props.props.labels.description}
                            facts={view.facts}
                            upsell={undefined}
                        />
                        {view.active === null ? null : (
                            <Resume
                                active={view.active}
                                labels={props.props.labels}
                                onAbandon={props.on.abandon}
                                isBusy={props.props.isAbandoning}
                            />
                        )}
                        {view.isLocked || props.props.needsPremium ? (
                            <LockedNotice
                                title={props.props.labels.lockedTitle}
                                description={props.props.labels.lockedDescription}
                                plansLabel={props.props.labels.plans}
                                plansHref={props.props.plansHref}
                            />
                        ) : null}
                        <Setup view={view} props={props.props} on={props.on} isLoading={isLoading} />
                    </Stack>
                )}
            />
            <History block={props.props.history} labels={props.props.labels} />
        </Stack>
    </Page>
)
