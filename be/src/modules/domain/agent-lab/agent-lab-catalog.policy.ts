import type {
    AgentLabConceptDefinition,
    AgentLabDefinition,
    AgentLabTrackDefinition,
    AgentLabTrackId,
} from "./agent-lab.contracts"
import { agentLabCopyOf } from "./messages/agent-lab.messages"

/**
 * The seven mindset concepts every track is graded on, as decision.agents.curriculum keeps them (ids are the record's; the names and
 * evidence lines are the canvas copy kept in the message file). They are tool-agnostic: the same seven apply to every track.
 */
export const AGENT_LAB_CONCEPTS: ReadonlyArray<AgentLabConceptDefinition> = [
    {
        id: "task-spec",
        label: agentLabCopyOf("concept.task-spec.label"),
        evidence: agentLabCopyOf("concept.task-spec.evidence"),
    },
    {
        id: "context",
        label: agentLabCopyOf("concept.context.label"),
        evidence: agentLabCopyOf("concept.context.evidence"),
    },
    {
        id: "tools-permissions",
        label: agentLabCopyOf("concept.tools-permissions.label"),
        evidence: agentLabCopyOf("concept.tools-permissions.evidence"),
    },
    {
        id: "verify",
        label: agentLabCopyOf("concept.verify.label"),
        evidence: agentLabCopyOf("concept.verify.evidence"),
    },
    {
        id: "decompose",
        label: agentLabCopyOf("concept.decompose.label"),
        evidence: agentLabCopyOf("concept.decompose.evidence"),
    },
    {
        id: "cost-limits",
        label: agentLabCopyOf("concept.cost-limits.label"),
        evidence: agentLabCopyOf("concept.cost-limits.evidence"),
    },
    {
        id: "operate",
        label: agentLabCopyOf("concept.operate.label"),
        evidence: agentLabCopyOf("concept.operate.evidence"),
    },
]

/**
 * The tool tracks of decision.agents.curriculum (Q-AG-2): Claude Code with the Claude Agent SDK on the learner's own Anthropic
 * account, then OpenClaw and Hermes Agent on the capped proxy key. Orca and others come later; the StarCi harness is an optional
 * capstone that is not open, so neither is a track here.
 */
export const AGENT_LAB_TRACKS: ReadonlyArray<AgentLabTrackDefinition> = [
    {
        id: "claude",
        label: agentLabCopyOf("track.claude.label"),
        focus: agentLabCopyOf("track.claude.focus"),
        keyMode: "byo",
    },
    {
        id: "openclaw",
        label: agentLabCopyOf("track.openclaw.label"),
        focus: agentLabCopyOf("track.openclaw.focus"),
        keyMode: "starci-proxy",
    },
    {
        id: "hermes",
        label: agentLabCopyOf("track.hermes.label"),
        focus: agentLabCopyOf("track.hermes.focus"),
        keyMode: "starci-proxy",
    },
]

/** The track with this id, or undefined when there is none. */
export const findAgentLabTrack = (id: string): AgentLabTrackDefinition | undefined =>
    AGENT_LAB_TRACKS.find((track) => track.id === id)

/** Whether the labs of the concept at this position open without Premium: only the first concept's (the free taste). */
export const isConceptFree = (position: number): boolean => position === 0

/** The labs the teacher wrote for one track, at most one per concept (the first of a concept wins). */
export const labsOfTrack = (
    labs: ReadonlyArray<AgentLabDefinition>,
    trackId: AgentLabTrackId,
): ReadonlyArray<AgentLabDefinition> =>
    labs.filter(
        (lab, position) =>
            lab.trackId === trackId &&
            labs.findIndex((other) => other.trackId === trackId && other.conceptId === lab.conceptId) === position,
    )
