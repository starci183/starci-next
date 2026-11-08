import type { AgentLabLocale } from "@modules/domain/agent-lab"

/** The locale of the lab area copy. */
export interface GetAgentLabRequest {
    /** The locale of the copy. */
    readonly locale: AgentLabLocale
}
