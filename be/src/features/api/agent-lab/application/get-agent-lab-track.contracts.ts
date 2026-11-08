import type { AgentLabLocale } from "@modules/domain/agent-lab"

/** The track to read and the locale of its copy. */
export interface GetAgentLabTrackRequest {
    /** The track id. */
    readonly trackId: string
    /** The locale of the copy. */
    readonly locale: AgentLabLocale
}
