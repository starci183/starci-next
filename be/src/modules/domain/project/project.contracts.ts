/** The kinds of project: an app of any topic, or an agent built on a real tool (decision.projects.model, decision.agents.curriculum). */
export const PROJECT_KINDS = ["app", "agent"] as const

/** Whether a project is an app or an agent, which decides the milestones it lists. */
export type ProjectKind = (typeof PROJECT_KINDS)[number]

/** The tool tracks of an agent project. */
export const AGENT_TRACKS = ["claude", "openclaw", "hermes"] as const

/** A tool track of an agent project. */
export type AgentTrack = (typeof AGENT_TRACKS)[number]

/** The locales of the text the capability serves. */
export const PROJECT_LOCALES = ["vi", "en"] as const

/** A locale of the served text. */
export type ProjectLocale = (typeof PROJECT_LOCALES)[number]

/** A line in both locales. */
export interface LocalizedText {
    /** The Vietnamese text. */
    readonly vi: string
    /** The English text. */
    readonly en: string
}

/** The evidence slots a concept can be proved with: a tagged test, an e2e flow, a StarCi probe, the AI reading the code. */
export const EVIDENCE_SLOTS = ["test", "e2e", "probe", "code-read"] as const

/** One evidence slot. */
export type EvidenceSlot = (typeof EVIDENCE_SLOTS)[number]

/**
 * Where a result came from: the learner machine through the relay or a CI run GitHub did not attest (`ci-signed`), both practice;
 * a GitHub-attested CI run (`ci`) or a server probe, both proof; the AI teacher.
 */
export const EVIDENCE_SOURCES = ["relay", "ci", "ci-signed", "server-probe", "ai"] as const

/** One source of evidence. */
export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number]

/** The sources whose passing result is proof: a GitHub-attested CI run, a server probe, the AI teacher's own read. */
export const PROOF_SOURCES: ReadonlyArray<EvidenceSource> = ["ci", "server-probe", "ai"]

/** The sources whose result is practice: the learner machine over the relay, and a CI run GitHub did not attest. */
export const PRACTICE_SOURCES: ReadonlyArray<EvidenceSource> = ["relay", "ci-signed"]

/** Whether a concept is shown by behaviour (tests and probes) or by structure (the AI reads the code). */
export type ConceptKind = "behaviour" | "structure"

/** Where a concept stands in a project: nothing yet, results from the machine only, or proved. */
export type ConceptState = "todo" | "practising" | "proved"

/** Where a milestone stands in a project. */
export type MilestoneState = "todo" | "in-progress" | "done"

/** What one evidence slot shows: its latest result passed, failed, or there is none. */
export type SlotState = "pass" | "fail" | "pending"

/** The StarCi generic probes, which the learner cannot edit. */
export const PROBE_IDS = [
    "health",
    "readiness",
    "invalid-input",
    "request-id",
    "repeat-same-key",
    "parallel-last-item",
    "repeat-get",
    "auth-required",
    "burst",
    "prompt-injection",
    "permission",
    "failure-path",
] as const

/** One generic probe. */
export type ProbeId = (typeof PROBE_IDS)[number]

/** One concept of the catalog: a Essentials lesson id with the evidence it needs. */
export interface ConceptDefinition {
    /** The concept id, equal to its Essentials lesson id. */
    readonly id: string
    /** The label per locale. */
    readonly label: LocalizedText
    /** Behaviour or structure. */
    readonly kind: ConceptKind
    /** The evidence it needs: every group is needed, and a group is met by any one of its slots. */
    readonly requires: ReadonlyArray<ReadonlyArray<EvidenceSlot>>
    /** The generic probes aimed at the endpoint the learner declares for the concept. */
    readonly probes: ReadonlyArray<ProbeId>
}

/** One milestone of the catalog: a list of concepts a path asks for. */
export interface MilestoneDefinition {
    /** The milestone id. */
    readonly id: string
    /** The title per locale. */
    readonly title: LocalizedText
    /** The concept ids in order. */
    readonly concepts: ReadonlyArray<string>
}

/** The answer of a milestone lookup: the milestone, or null when the id is not one of the catalog. */
export type MilestoneLookup = MilestoneDefinition | null

/** One result of the evidence, the latest per concept, slot, source and ref. */
export interface EvidenceRow {
    /** The project. */
    readonly projectId: string
    /** The concept. */
    readonly conceptId: string
    /** The slot. */
    readonly slot: EvidenceSlot
    /** The source. */
    readonly source: EvidenceSource
    /** Whether it passed. */
    readonly passed: boolean
    /** The test name, e2e file, probe id or code location. */
    readonly ref: string
    /** The run id. */
    readonly runId: string
    /** The commit, or null. */
    readonly commitSha: string | null
    /** The short facts of the result. */
    readonly detail: Readonly<Record<string, unknown>>
    /** When it was produced. */
    readonly at: Date
}

/** One result to append. */
export interface EvidenceInput {
    /** The concept. */
    readonly conceptId: string
    /** The slot. */
    readonly slot: EvidenceSlot
    /** The source. */
    readonly source: EvidenceSource
    /** Whether it passed. */
    readonly passed: boolean
    /** The test name, e2e file, probe id or code location. */
    readonly ref: string
    /** The run id. */
    readonly runId: string
    /** The commit, or null. */
    readonly commitSha: string | null
    /** The short facts of the result. */
    readonly detail: Readonly<Record<string, unknown>>
    /** When it was produced. */
    readonly at: Date
}

/** One result of a relay check, as the relay channel reports it (contract.relay.channel `check.result`). */
export interface RelayCheckResult {
    /** The event id; the same event never counts twice. */
    readonly eventId: string
    /** The run the check belongs to. */
    readonly runId: string
    /** The concept. */
    readonly conceptId: string
    /** The slot: test, e2e or probe. */
    readonly slot: EvidenceSlot
    /** The test name, e2e file or probe id. */
    readonly ref: string
    /** Whether it passed. */
    readonly passed: boolean
    /** The commit it ran on, or null. */
    readonly commit: string | null
    /** When it ran. */
    readonly at: Date
}

/** The settings of the capability, each with its default. */
export interface ProjectSettings {
    /** Projects a learner without Premium may own. */
    readonly freeProjects: number
    /** Milestone ids a learner without Premium may open. */
    readonly freeMilestones: ReadonlyArray<string>
    /** Probe runs one project may start per hour. */
    readonly probeRunsPerHour: number
    /** AI code reads one learner may start per UTC day. */
    readonly codeReadsPerDay: number
    /** The milliseconds a probe request may take. */
    readonly probeTimeoutMs: number
    /** The bytes of a probe response StarCi reads. */
    readonly probeMaxBytes: number
    /** The parallel requests of the last-item probe. */
    readonly probeParallel: number
    /** The milliseconds a CI delivery's timestamp may differ from now. */
    readonly ciToleranceMs: number
    /** The milliseconds the AI teacher has for a code read. */
    readonly codeReadTimeoutMs: number
}

/** One criterion of the rubric of a Essentials lesson, which the AI teacher grades a code read against. */
export interface ProjectCriterion {
    /** The criterion id. */
    readonly id: string
    /** The criterion as the learner reads it. */
    readonly criterion: string
    /** What a good answer shows; never leaves the server. */
    readonly expectedEvidence: string
    /** The misconception the criterion catches; never leaves the server. */
    readonly misconception: string
}

/** A Essentials lesson that backs a concept. */
export interface ConceptLessonRef {
    /** The lesson id, equal to the concept id. */
    readonly id: string
    /** The live version. */
    readonly version: string
    /** The title in the asked locale. */
    readonly title: string
    /** The topic slug. */
    readonly topicId: string
}

/** The rubric of a lesson's AI-graded activity; no criteria means the lesson has none yet. */
export interface ProjectRubric {
    /** The criteria in order. */
    readonly criteria: ReadonlyArray<ProjectCriterion>
}
