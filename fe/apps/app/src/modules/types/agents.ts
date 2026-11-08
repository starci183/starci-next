import type { AgentQuotaBarTone, AgentTrackBadge } from "@starci-next/ui"

/** One track of the overview as a tile: its words, badges and where it opens. */
export type AgentTrackTileView = {
    readonly id: string
    readonly name: string
    readonly description: string
    readonly badges: readonly [AgentTrackBadge] | readonly [AgentTrackBadge, AgentTrackBadge]
    readonly facts: ReadonlyArray<string>
    readonly href: string
}

/** What the quota line draws. */
export type AgentQuotaView = {
    readonly title: string
    readonly description: string
    readonly tone: AgentQuotaBarTone
    readonly percentLeft: number | undefined
    readonly valueText: string
}
