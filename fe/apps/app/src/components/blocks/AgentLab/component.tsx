import { Grid, Page, Stack } from "@starci/grammar/common"
import {
    AgentConceptList,
    AgentQuotaBar,
    AgentSoonCard,
    AgentTrackTile,
    CatalogIntro,
    SlotView,
    type AgentConceptRow,
} from "@starci-next/ui"
import type { AgentQuotaView, AgentTrackTileView, DataSlot, SlotLabels } from "@/modules/types"

/** The agent lab overview as it is drawn: the facts under the title, the tool tiles and the mindset concepts. */
export type AgentLabScreenView = {
    readonly facts: ReadonlyArray<string>
    readonly tracks: ReadonlyArray<AgentTrackTileView>
    readonly concepts: ReadonlyArray<AgentConceptRow>
}

/** The fake overview with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const AGENT_LAB_PLACEHOLDER: AgentLabScreenView = {
    facts: ["xxxxxx", "xxxxxxxx"],
    tracks: [1, 2, 3].map((index) => ({
        id: `placeholder-${index}`,
        name: "xxxxxxxxxx",
        description: "xxxxxxxxxxxxxxxx",
        badges: [{ label: "xxxxxx" }, { label: "xxxxxx" }],
        facts: ["xxxxxx"],
        href: "/",
    })),
    concepts: [1, 2, 3, 4, 5, 6, 7].map((index) => ({
        id: `placeholder-${index}`,
        title: "xxxxxxxxxx",
        description: "xxxxxxxxxxxxxxxx",
        badge: "",
    })),
}

/** The fixed words of the overview. */
export type AgentLabLabels = {
    readonly intro: { readonly eyebrow: string; readonly title: string; readonly description: string }
    readonly tracksLabel: string
    readonly openTrack: string
    readonly conceptsLabel: string
    readonly conceptsEmpty: string
    readonly quotaBarLabel: string
    readonly tools: { readonly title: string; readonly description: string; readonly badge: string }
    readonly harness: { readonly title: string; readonly description: string; readonly badge: string }
    readonly proof: {
        readonly title: string
        readonly description: string
        readonly cta: string
        readonly href: string
    }
}

/** Props for {@link AgentLabBase}. */
export type AgentLabBaseProps = {
    readonly props: {
        readonly slot: DataSlot<AgentLabScreenView>
        readonly quota: DataSlot<AgentQuotaView>
        readonly placeholder: AgentLabScreenView
        readonly quotaPlaceholder: AgentQuotaView
        readonly slotLabels: SlotLabels
        readonly labels: AgentLabLabels
    }
    readonly on: { readonly retry: () => void; readonly retryQuota: () => void }
}

/** The model-call line of the proxy-key labs, with its own status handling so a failed quota never hides the tools. */
const QuotaSection = (props: AgentLabBaseProps) => (
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

/**
 * Draws the agent lab the way the canvas does: the intro, the model-call line, the three tool tiles, the seven mindset concepts, then
 * what is not open yet (other tools, the optional StarCi harness) and the way to the agent project where the proof lives.
 */
export const AgentLabBase = (props: AgentLabBaseProps) => (
    <Page>
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(view, isLoading) => (
                <Stack gap="region">
                    <CatalogIntro {...props.props.labels.intro} facts={view.facts} upsell={undefined} />
                    <QuotaSection {...props} />
                    <Grid kind="cards">
                        {view.tracks.map((track) => (
                            <AgentTrackTile key={track.id} {...track} openLabel={props.props.labels.openTrack} />
                        ))}
                    </Grid>
                    <AgentConceptList
                        label={props.props.labels.conceptsLabel}
                        emptyLabel={props.props.labels.conceptsEmpty}
                        rows={view.concepts}
                        isLoading={isLoading}
                    />
                    <Grid kind="cards">
                        <AgentSoonCard {...props.props.labels.tools} action={undefined} />
                        <AgentSoonCard {...props.props.labels.harness} action={undefined} />
                    </Grid>
                    <AgentSoonCard
                        title={props.props.labels.proof.title}
                        description={props.props.labels.proof.description}
                        badge=""
                        action={{ label: props.props.labels.proof.cta, href: props.props.labels.proof.href }}
                    />
                </Stack>
            )}
        />
    </Page>
)
