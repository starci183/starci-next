import type { AgentLabDefinition, AgentLabTrackId } from "./agent-lab.contracts"

/** Options of the agent lab capability. */
export interface AgentLabOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The model calls one learner may make through StarCi's proxy key per UTC day; absent, 50. */
    readonly dailyCalls?: number
    /** The tool version each track's labs are pinned to; a track not named has no pin yet. */
    readonly pinnedVersions?: Readonly<Partial<Record<AgentLabTrackId, string>>>
    /** The labs the teacher wrote; absent, none. */
    readonly labs?: ReadonlyArray<AgentLabDefinition>
}
