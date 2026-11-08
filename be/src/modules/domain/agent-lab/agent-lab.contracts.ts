/** The locales of the lab copy. */
export type AgentLabLocale = "vi" | "en"

/** Text in both locales. */
export type AgentLabText = Readonly<Record<AgentLabLocale, string>>

/** The tracks of the agent lab: the tools learners operate on their own machine. */
export type AgentLabTrackId = "claude" | "openclaw" | "hermes"

/** Who pays for the model calls of a track: StarCi through a capped proxy key, or the learner's own account. */
export type AgentLabKeyMode = "starci-proxy" | "byo"

/** The state of a lab: not written yet, a draft, approved by the teacher (the only state that opens), or outdated. */
export type AgentLabStatus = "being-written" | "draft" | "approved" | "outdated"

/** One step of a lab, written from the official docs at the pinned version. */
export interface AgentLabStepDefinition {
    /** The step text in both locales. */
    readonly text: AgentLabText
    /** The official doc page the step cites. */
    readonly sourceUrl: string
}

/** A lab the teacher wrote (or approved): the content source of the lab area. None exists yet. */
export interface AgentLabDefinition {
    /** The stable lab id. */
    readonly labId: string
    /** The track the lab belongs to. */
    readonly trackId: AgentLabTrackId
    /** The mindset concept the lab teaches; each track has at most one lab per concept. */
    readonly conceptId: string
    /** `draft`, `approved` or `outdated`; only `approved` opens. */
    readonly status: Exclude<AgentLabStatus, "being-written">
    /** The title in both locales. */
    readonly title: AgentLabText
    /** The steps from the official docs. */
    readonly steps: ReadonlyArray<AgentLabStepDefinition>
}

/** A mindset concept every track is graded on. */
export interface AgentLabConceptDefinition {
    /** The stable concept id. */
    readonly id: string
    /** The short name. */
    readonly label: AgentLabText
    /** What counts as evidence. */
    readonly evidence: AgentLabText
}

/** A tool track. */
export interface AgentLabTrackDefinition {
    /** The stable track id. */
    readonly id: AgentLabTrackId
    /** The tool name. */
    readonly label: AgentLabText
    /** One line on what the tool is. */
    readonly focus: AgentLabText
    /** Who pays for the model calls. */
    readonly keyMode: AgentLabKeyMode
}

/** A mindset concept as the learner sees it. */
export interface AgentLabConceptView {
    /** The concept id. */
    readonly id: string
    /** The short name in the asked locale. */
    readonly label: string
    /** The evidence in the asked locale. */
    readonly evidence: string
    /** Whether the labs of this concept are open without Premium (the first concept). */
    readonly free: boolean
}

/** A track as the overview lists it. */
export interface AgentLabTrackSummaryView {
    /** The track id. */
    readonly id: AgentLabTrackId
    /** The tool name. */
    readonly label: string
    /** One line on the tool. */
    readonly focus: string
    /** Who pays for the model calls. */
    readonly keyMode: AgentLabKeyMode
    /** The tool version the labs are pinned to, or null before the teacher pins one. */
    readonly pinnedVersion: string | null
    /** How many labs exist for the track (one per concept at most). */
    readonly labCount: number
    /** How many labs the learner can open now. */
    readonly openLabCount: number
}

/** One step of a lab as the learner sees it. */
export interface AgentLabStepView {
    /** The step text in the asked locale. */
    readonly text: string
    /** The official doc page. */
    readonly sourceUrl: string
}

/** One cell of a track's grid: a concept on the track and its lab. */
export interface AgentLabCellView {
    /** The concept id. */
    readonly conceptId: string
    /** The concept name in the asked locale. */
    readonly conceptLabel: string
    /** The lab id, or null while the lab is not written. */
    readonly labId: string | null
    /** The state of the lab. */
    readonly status: AgentLabStatus
    /** The lab title, or null while it is not written. */
    readonly title: string | null
    /** Whether the concept needs Premium and the learner holds none. */
    readonly locked: boolean
    /** Whether the learner can follow the lab now: approved and not locked. */
    readonly open: boolean
    /** The steps; empty unless the lab is open. */
    readonly steps: ReadonlyArray<AgentLabStepView>
}

/** The overview of the lab area. */
export interface AgentLabOverviewView {
    /** The tracks. */
    readonly tracks: ReadonlyArray<AgentLabTrackSummaryView>
    /** The seven mindset concepts. */
    readonly concepts: ReadonlyArray<AgentLabConceptView>
}

/** One track with its grid of labs. */
export interface AgentLabTrackView extends AgentLabTrackSummaryView {
    /** One cell per concept, in the order of the concepts. */
    readonly cells: ReadonlyArray<AgentLabCellView>
}

/** The model-call quota of a learner for the UTC day. */
export interface AgentQuotaView {
    /** The most calls per day. */
    readonly limit: number
    /** The calls made today. */
    readonly used: number
    /** The calls left today. */
    readonly remaining: number
    /** Whether no call is left, the hard-stop state. */
    readonly exhausted: boolean
    /** The next UTC midnight, an ISO instant, when the count starts over. */
    readonly resetsAt: string
}
