import type { AgentConceptRow, AgentLabCell } from "@starci-next/ui"
import type { AgentLabOverview, AgentLabTrack, AgentQuota } from "@/hooks/swr"
import { isAgentTrackNotFound } from "@/modules/failure"
import { agentTrackPath } from "@/modules/routes"
import type { AgentQuotaView, AgentTrackTileView } from "@/modules/types"

/** The words the agent lab views are built with, resolved by the block. */
export type AgentWords = {
    /** Who pays for the model calls of a track. */
    readonly keyMode: Readonly<Record<string, string>>
    /** The badge of the pinned tool version, or the note that the teacher has not pinned one yet. */
    readonly pinned: (version: string | null) => string
    /** The facts of a track: the labs written and the labs the reader can open. */
    readonly labFacts: (count: number, open: number) => string
    /** The badge of the concept whose labs are open without Premium. */
    readonly conceptFree: string
    /** The state of a lab by its status, as a badge. */
    readonly status: Readonly<Record<string, string>>
    /** The badge of a lab that needs Premium. */
    readonly locked: string
    /** The line of a lab the teacher has not written. */
    readonly beingWritten: string
    /** The words of the quota line. */
    readonly quota: {
        readonly remainingTitle: (remaining: number) => string
        readonly remainingText: string
        readonly stoppedTitle: string
        readonly stoppedText: (time: string) => string
        readonly ownTitle: string
        readonly ownText: string
        readonly barLabel: string
        readonly valueText: (remaining: number, limit: number) => string
    }
    /** The time of the next reset, in the words of the reader locale. */
    readonly timeOf: (iso: string) => string
}

/** True when the refusal says the track does not exist. It branches on the stable code, never on the status. */
export const isTrackMissing = (error: unknown): boolean => isAgentTrackNotFound(error)

/** The tracks of the overview as tiles. */
export const trackTilesOf = (overview: AgentLabOverview, words: AgentWords): ReadonlyArray<AgentTrackTileView> =>
    overview.tracks.map((track) => ({
        id: track.id,
        name: track.label,
        description: track.focus,
        badges: [
            {
                label: words.keyMode[track.keyMode] ?? track.keyMode,
                tone: track.keyMode === "byo" ? "accent" : "neutral",
            },
            { label: words.pinned(track.pinnedVersion), tone: "muted" },
        ],
        facts: [words.labFacts(track.labCount, track.openLabCount)],
        href: agentTrackPath(track.id),
    }))

/** The seven mindset concepts as rows. */
export const conceptRowsOf = (overview: AgentLabOverview, words: AgentWords): ReadonlyArray<AgentConceptRow> =>
    overview.concepts.map((concept) => ({
        id: concept.id,
        title: concept.label,
        description: concept.evidence,
        badge: concept.free ? words.conceptFree : "",
    }))

/** The tone of the badge of a lab by its status. */
const toneOf = (status: string): AgentLabCell["badgeTone"] => {
    if (status === "approved") return "success"
    if (status === "draft" || status === "outdated") return "warning"
    return "muted"
}

/** The labs of a track as rows: the concept, the lab title or the note that the teacher is writing it, and its state. */
export const labCellsOf = (track: AgentLabTrack, words: AgentWords): ReadonlyArray<AgentLabCell> =>
    track.cells.map((cell) => {
        const locked = cell.locked && !cell.open
        return {
            id: cell.conceptId,
            title: cell.conceptLabel,
            description: cell.title ?? words.beingWritten,
            badge: locked ? words.locked : (words.status[cell.status] ?? cell.status),
            badgeTone: locked ? "neutral" : toneOf(cell.status),
            steps: cell.steps.map((step) => ({ text: step.text, sourceUrl: step.sourceUrl })),
        }
    })

/** The fake quota line, drawn as a skeleton while the first read runs. */
export const AGENT_QUOTA_PLACEHOLDER: AgentQuotaView = {
    title: "xxxxxxxxxxxx",
    description: "xxxxxxxxxxxxxxxxxxxx",
    tone: "remaining",
    percentLeft: 50,
    valueText: "xxxxxx",
}

/** The share of today calls still left, as a whole percent from 0 to 100. */
const percentOf = (quota: AgentQuota): number =>
    quota.limit <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((quota.remaining / quota.limit) * 100)))

/**
 * The model-call line. A track on the own account of the learner (keyMode `byo`) shows that note and no bar; a track on the capped
 * proxy key shows the calls left today, and the hard stop at zero.
 */
export const quotaViewOf = (quota: AgentQuota, keyMode: string, words: AgentWords): AgentQuotaView => {
    if (keyMode === "byo") {
        return {
            title: words.quota.ownTitle,
            description: words.quota.ownText,
            tone: "ownAccount",
            percentLeft: undefined,
            valueText: "",
        }
    }
    const valueText = words.quota.valueText(quota.remaining, quota.limit)
    if (quota.exhausted) {
        return {
            title: words.quota.stoppedTitle,
            description: words.quota.stoppedText(words.timeOf(quota.resetsAt)),
            tone: "stopped",
            percentLeft: 0,
            valueText,
        }
    }
    return {
        title: words.quota.remainingTitle(quota.remaining),
        description: words.quota.remainingText,
        tone: "remaining",
        percentLeft: percentOf(quota),
        valueText,
    }
}
