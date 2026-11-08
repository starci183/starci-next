import { Link, Page, Stack } from "@starci/grammar/common"
import {
    AgentLabGrid,
    AgentQuotaBar,
    AgentSoonCard,
    CatalogIntro,
    MissingNotice,
    SlotView,
    type AgentLabCell,
} from "@starci-next/ui"
import type { AgentQuotaView, DataSlot, SlotLabels } from "@/modules/types"

/** One tool track as it is drawn: the facts under the title and the grid of its labs. */
export type AgentTrackScreenView = {
    readonly title: string
    readonly description: string
    readonly facts: ReadonlyArray<string>
    /** Who pays for the model calls: `byo` shows the own-account note, `starci-proxy` the calls left today. */
    readonly keyMode: string
    readonly cells: ReadonlyArray<AgentLabCell>
}

/** The fake track with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const AGENT_TRACK_PLACEHOLDER: AgentTrackScreenView = {
    title: "xxxxxxxxxx",
    description: "xxxxxxxxxxxxxxxx",
    facts: ["xxxxxx", "xxxxxxxx"],
    keyMode: "starci-proxy",
    cells: [1, 2, 3, 4, 5, 6, 7].map((index) => ({
        id: `placeholder-${index}`,
        title: "xxxxxxxxxx",
        description: "xxxxxxxxxxxxxxxx",
        badge: "xxxxxx",
        badgeTone: "muted" as const,
        steps: [],
    })),
}

/** The fixed words of the track page. */
export type AgentTrackLabels = {
    readonly eyebrow: string
    readonly back: string
    readonly backHref: string
    readonly labsLabel: string
    readonly labsEmpty: string
    readonly sourceLabel: string
    readonly quotaBarLabel: string
    readonly notFound: string
    readonly notFoundText: string
    readonly proof: {
        readonly title: string
        readonly description: string
        readonly cta: string
        readonly href: string
    }
}

/** Props for {@link AgentTrackBase}. */
export type AgentTrackBaseProps = {
    readonly props: {
        readonly slot: DataSlot<AgentTrackScreenView>
        readonly quota: DataSlot<AgentQuotaView>
        /** True when the back end said the agent lab has no such track: a missing page, not a failed read. */
        readonly isNotFound: boolean
        readonly placeholder: AgentTrackScreenView
        readonly quotaPlaceholder: AgentQuotaView
        readonly slotLabels: SlotLabels
        readonly labels: AgentTrackLabels
    }
    readonly on: { readonly retry: () => void; readonly retryQuota: () => void }
}

/** The model-call line of the track, with its own status handling so a failed quota never hides the labs. */
const QuotaSection = (props: AgentTrackBaseProps) => (
    <SlotView
        slot={props.props.quota}
        placeholder={props.props.quotaPlaceholder}
        labels={props.props.slotLabels}
        forbidden="hide"
        onRetry={props.on.retryQuota}
        render={(quota, isLoading) => (
            <AgentQuotaBar
                title={quota.title}
                description={quota.description}
                tone={quota.tone}
                percentLeft={quota.percentLeft}
                barLabel={props.props.labels.quotaBarLabel}
                valueText={quota.valueText}
                isLoading={isLoading}
            />
        )}
    />
)

/** What the settled track needs: the screen's props, the track and whether it is the skeleton's. */
type TrackViewProps = {
    readonly base: AgentTrackBaseProps
    readonly view: AgentTrackScreenView
    readonly isLoading: boolean
}

/** The settled track: the way back, the intro, the model-call line, the labs and the way to the agent project. */
const TrackView = (props: TrackViewProps) => {
    const { view, isLoading } = props
    return (
        <Stack gap="region">
            <Link href={props.base.props.labels.backHref}>{props.base.props.labels.back}</Link>
            <CatalogIntro
                eyebrow={props.base.props.labels.eyebrow}
                title={view.title}
                description={view.description}
                facts={view.facts}
                upsell={undefined}
            />
            <QuotaSection {...props.base} />
            <AgentLabGrid
                label={props.base.props.labels.labsLabel}
                emptyLabel={props.base.props.labels.labsEmpty}
                sourceLabel={props.base.props.labels.sourceLabel}
                cells={view.cells}
                isLoading={isLoading}
            />
            <AgentSoonCard
                title={props.base.props.labels.proof.title}
                description={props.base.props.labels.proof.description}
                badge=""
                action={{ label: props.base.props.labels.proof.cta, href: props.base.props.labels.proof.href }}
            />
        </Stack>
    )
}

/**
 * Draws one tool track: the way back, the intro with the pinned version, the model-call line (or the note that the learner uses their
 * own account), the labs by concept, each saying the teacher is still writing it until it is approved, and the way to the agent project.
 */
export const AgentTrackBase = (props: AgentTrackBaseProps) => (
    <Page>
        {props.props.isNotFound ? (
            <MissingNotice
                message={props.props.labels.notFound}
                description={props.props.labels.notFoundText}
                backLabel={props.props.labels.back}
                backHref={props.props.labels.backHref}
            />
        ) : (
            <SlotView
                slot={props.props.slot}
                placeholder={props.props.placeholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retry}
                render={(view, isLoading) => <TrackView base={props} view={view} isLoading={isLoading} />}
            />
        )}
    </Page>
)
