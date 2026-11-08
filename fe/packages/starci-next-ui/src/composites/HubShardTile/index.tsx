import { SurfaceCard, type BadgeData } from "@starci/grammar/common"

/** One learning shard of the hub, every word resolved. */
export type HubShardView = {
    readonly id: string
    /** The step the shard stands for (understand, remember, practise). */
    readonly stage: string
    readonly title: string
    readonly href: string
    /** The next action, in one sentence. */
    readonly next: string
    /** The progress line, or the note that the numbers could not load. */
    readonly progressLabel: string
    /** The streak counter of this shard, in words. */
    readonly counter: string
    /** The shard is still being written: it shows its promise and links nowhere. */
    readonly isSoon: boolean
    /** The verified-experience count in words; undefined while the experience read does not exist, then nothing is drawn. */
    readonly verified: string | undefined
    /** The count awaiting the teacher in words, or undefined. */
    readonly pending: string | undefined
}

/** The fixed words of a shard tile. */
export type HubShardLabels = {
    readonly open: string
    readonly soon: string
}

/** A learning shard as one peer tile of the hub grid. */
type HubShardTileProps = {
    readonly shard: HubShardView
    readonly labels: HubShardLabels
}

/** The badges a tile may carry: one to three. */
type TileBadges = readonly [BadgeData] | readonly [BadgeData, BadgeData] | readonly [BadgeData, BadgeData, BadgeData]

/** The badge row of a tile: the soon note or the shard counter, then the experience counts that exist. */
const badgesOf = (shard: HubShardView, labels: HubShardLabels): TileBadges => {
    const first: BadgeData = shard.isSoon ? { label: labels.soon, tone: "muted" } : { label: shard.counter }
    const verified: BadgeData | undefined =
        shard.verified === undefined ? undefined : { label: shard.verified, tone: "success" }
    const pending: BadgeData | undefined =
        shard.pending === undefined ? undefined : { label: shard.pending, tone: "warning" }
    if (verified !== undefined && pending !== undefined) return [first, verified, pending]
    if (verified !== undefined) return [first, verified]
    return pending === undefined ? [first] : [first, pending]
}

/** The destination of a live tile; a tile still being written has none. */
const destinationOf = (shard: HubShardView, labels: HubShardLabels) =>
    shard.isSoon ? {} : { wholeAction: { kind: "link" as const, href: shard.href, label: labels.open } }

/** One shard tile: step, name, next action, progress line, own counter and the experience counts that exist. */
export const HubShardTile = (props: HubShardTileProps) => (
    <SurfaceCard
        kind="tile"
        name={props.shard.title}
        byline={props.shard.stage}
        description={props.shard.next}
        facts={props.shard.progressLabel}
        mark={{ avatar: { name: props.shard.title, seed: props.shard.id } }}
        badges={badgesOf(props.shard, props.labels)}
        {...destinationOf(props.shard, props.labels)}
    />
)
