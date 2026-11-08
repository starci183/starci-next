import type {
    AgentLabConceptDefinition,
    AgentLabDefinition,
    AgentLabText,
    AgentLabTrackDefinition,
    AgentLabTrackId,
} from "./agent-lab.contracts"
import { AGENT_LAB_COPY } from "./messages/agent-lab.messages"

/** The copy of one catalog entry in both locales, read from the message file. */
const copy = (key: string): AgentLabText => ({
    vi: AGENT_LAB_COPY.vi[key] ?? key,
    en: AGENT_LAB_COPY.en[key] ?? key,
})

/**
 * The seven mindset concepts every track is graded on, as decision.agents.curriculum keeps them (ids are the record's; the names and
 * evidence lines are the canvas copy kept in the message file). They are tool-agnostic: the same seven apply to every track.
 */
export const AGENT_LAB_CONCEPTS: ReadonlyArray<AgentLabConceptDefinition> = [
    {
        id: "task-spec",
        label: copy("concept.task-spec.label"),
        evidence: copy("concept.task-spec.evidence"),
    },
    {
        id: "context",
        label: copy("concept.context.label"),
        evidence: copy("concept.context.evidence"),
    },
    {
        id: "tools-permissions",
        label: copy("concept.tools-permissions.label"),
        evidence: copy("concept.tools-permissions.evidence"),
    },
    {
        id: "verify",
        label: copy("concept.verify.label"),
        evidence: copy("concept.verify.evidence"),
    },
    {
        id: "decompose",
        label: copy("concept.decompose.label"),
        evidence: copy("concept.decompose.evidence"),
    },
    {
        id: "cost-limits",
        label: copy("concept.cost-limits.label"),
        evidence: copy("concept.cost-limits.evidence"),
    },
    {
        id: "operate",
        label: copy("concept.operate.label"),
        evidence: copy("concept.operate.evidence"),
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
        label: copy("track.claude.label"),
        focus: copy("track.claude.focus"),
        keyMode: "byo",
    },
    {
        id: "openclaw",
        label: copy("track.openclaw.label"),
        focus: copy("track.openclaw.focus"),
        keyMode: "starci-proxy",
    },
    {
        id: "hermes",
        label: copy("track.hermes.label"),
        focus: copy("track.hermes.focus"),
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
