/** Events the agent lab records; fields are ids and counts, never a prompt or a key. */
export enum AgentLabLogEvent {
    /** A learner reached the daily cap of model calls. */
    QuotaExhausted = "agent_lab.quota_exhausted",
}
