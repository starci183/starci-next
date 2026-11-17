import { SurfaceCard } from "@starci/grammar/common"

/** A badge of a track tile. */
export type AgentTrackBadge = { readonly label: string; readonly tone?: "accent" | "muted" | "neutral" }

/** One tool track of the agent lab, worded by its block. */
type AgentTrackTileProps = {
    readonly id: string
    readonly name: string
    readonly description: string
    /** The key badge (who pays for the model calls) and, when there is one, the pinned version badge. */
    readonly badges: readonly [AgentTrackBadge] | readonly [AgentTrackBadge, AgentTrackBadge]
    /** The facts of the track: how many labs exist and open, already in words. */
    readonly facts: ReadonlyArray<string>
    readonly href: string
    /** The words of the whole-card link. */
    readonly openLabel: string
}

/** A tool track as one peer tile: its name, what the tool is, who pays for the model, the pinned version and the labs it has. */
export const AgentTrackTile = (props: AgentTrackTileProps) => (
    <SurfaceCard
        kind="tile"
        name={props.name}
        description={props.description}
        facts={props.facts}
        mark={{ avatar: { name: props.name, seed: props.id } }}
        badges={props.badges}
        wholeAction={{ kind: "link", href: props.href, label: props.openLabel }}
    />
)
