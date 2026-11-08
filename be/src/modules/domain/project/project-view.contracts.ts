import type {
    AgentTrack,
    ConceptKind,
    ConceptState,
    EvidenceSlot,
    EvidenceSource,
    MilestoneState,
    ProjectKind,
    SlotState,
} from "./project.contracts"

/** A fact of a result for the screen's text: a short key with a string or number. */
export interface FactView {
    /** The key. */
    readonly key: string
    /** The value as text. */
    readonly value: string
}

/** One evidence slot of a concept. */
export interface SlotView {
    /** The slot. */
    readonly slot: EvidenceSlot
    /** Whether the concept needs this slot (or another of its group). */
    readonly required: boolean
    /** The latest result. */
    readonly state: SlotState
    /** Whether the latest passing result is proof (signed CI, server probe, AI) and not only practice. */
    readonly proof: boolean
    /** Where the latest result came from, or null. */
    readonly source: EvidenceSource | null
    /** The test name, e2e file, probe id or location of the latest result, or null. */
    readonly ref: string | null
    /** When the latest result was produced, or null. */
    readonly at: string | null
}

/** The latest failing result of a concept, with what the learner is told. */
export interface FailureView {
    /** The slot that failed. */
    readonly slot: EvidenceSlot
    /** The probe that failed, or null. */
    readonly probeId: string | null
    /** The stable reason code of the failure. */
    readonly reason: string
    /** The facts of the failure. */
    readonly facts: ReadonlyArray<FactView>
    /** The Socratic question the AI teacher asks, in the locale. */
    readonly question: string
}

/** The Essentials lesson a concept routes the learner to. */
export interface ConceptLessonView {
    /** The lesson id, equal to the concept id. */
    readonly id: string
    /** The topic slug of the lesson. */
    readonly topicId: string
    /** The title in the locale. */
    readonly title: string
}

/** One concept of a milestone in a project. */
export interface ConceptView {
    /** The concept id. */
    readonly id: string
    /** The label in the locale. */
    readonly label: string
    /** Behaviour or structure. */
    readonly kind: ConceptKind
    /** Where it stands. */
    readonly state: ConceptState
    /** True while the teacher is writing the lesson (being written by the teacher); such a concept is left out of done. */
    readonly comingSoon: boolean
    /** The lesson to relearn, or null while it is being written. */
    readonly lesson: ConceptLessonView | null
    /** The code location the learner points to, or null. */
    readonly location: string | null
    /** The endpoint the probes aim at, or null. */
    readonly endpoint: string | null
    /** The sample body the probes send, or null. */
    readonly sampleBody: string | null
    /** The evidence slots in order. */
    readonly slots: ReadonlyArray<SlotView>
    /** The latest failing result, or null. */
    readonly failing: FailureView | null
    /** The question of the AI teacher from the last code read, or null. */
    readonly aiQuestion: string | null
}

/** A milestone of the catalog as a project shows it. */
export interface MilestoneSummaryView {
    /** The milestone id. */
    readonly id: string
    /** The title in the locale. */
    readonly title: string
    /** How many concepts it lists. */
    readonly conceptCount: number
    /** How many of them are proved in this project. */
    readonly provedCount: number
    /** Where it stands. */
    readonly state: MilestoneState
    /** True when opening it needs Premium and the learner has none. */
    readonly locked: boolean
}

/** The last signed CI run of a project. */
export interface CiRunView {
    /** The run id. */
    readonly runId: string
    /** The commit. */
    readonly commit: string
    /** Whether the whole run passed. */
    readonly passed: boolean
    /** When it was received. */
    readonly at: string
}

/** The result of one probe of a run. */
export interface ProbeResultView {
    /** The probe. */
    readonly probeId: string
    /** The concept it was aimed for, or null for the deployment probes. */
    readonly conceptId: string | null
    /** Whether it passed. */
    readonly passed: boolean
    /** The stable reason code. */
    readonly reason: string
    /** The facts of the result. */
    readonly facts: ReadonlyArray<FactView>
}

/** The last probe run of a project against its deployed address. */
export interface ProbeRunView {
    /** The run id. */
    readonly runId: string
    /** The address probed. */
    readonly url: string
    /** Whether every probe passed. */
    readonly passed: boolean
    /** Each probe. */
    readonly results: ReadonlyArray<ProbeResultView>
    /** When it ran. */
    readonly at: string
}

/** A project in the list. */
export interface ProjectSummaryView {
    /** The project id. */
    readonly id: string
    /** The name. */
    readonly name: string
    /** App or agent. */
    readonly kind: ProjectKind
    /** The topic. */
    readonly topic: string
    /** The main language. */
    readonly language: string
    /** The stack line. */
    readonly stack: string
    /** The agent track, or null. */
    readonly track: AgentTrack | null
    /** The repository address, or null. */
    readonly repoUrl: string | null
    /** The deployed address, or null. */
    readonly deployedUrl: string | null
    /** How many milestone concepts are proved in this project. */
    readonly provedConceptCount: number
    /** How many concepts its milestones list (the ones with a lesson). */
    readonly conceptCount: number
    /** The milestone being worked on, or null when all are done. */
    readonly currentMilestoneId: string | null
    /** How many milestones are done. */
    readonly doneMilestoneCount: number
    /** How many milestones the project lists. */
    readonly milestoneCount: number
    /** When it was created. */
    readonly createdAt: string
}

/** One project with its milestones, practice and proof. */
export interface ProjectView extends ProjectSummaryView {
    /** The milestones in order. */
    readonly milestones: ReadonlyArray<MilestoneSummaryView>
    /** How many concepts show results from the machine only. */
    readonly practisingConceptCount: number
    /** The last signed CI run, or null. */
    readonly lastCiRun: CiRunView | null
    /** The last probe run, or null. */
    readonly lastProbeRun: ProbeRunView | null
}

/** One milestone of a project with its concept checklist. */
export interface MilestoneView {
    /** The project, in short. */
    readonly project: ProjectSummaryView
    /** The milestone. */
    readonly milestone: MilestoneSummaryView
    /** The concepts in order. */
    readonly concepts: ReadonlyArray<ConceptView>
}

/** A project just created or whose CI secret was rotated: the secret is shown this once. */
export interface ProjectSecretView {
    /** The project. */
    readonly project: ProjectSummaryView
    /** The secret that signs CI results; never served again. */
    readonly ciSecret: string
}

/** A concept in the catalog. */
export interface CatalogConceptView {
    /** The concept id. */
    readonly id: string
    /** The label in the locale. */
    readonly label: string
    /** Behaviour or structure. */
    readonly kind: ConceptKind
    /** The slots it needs: every group, any one of the group's slots. */
    readonly requires: ReadonlyArray<ReadonlyArray<EvidenceSlot>>
    /** The probes it uses. */
    readonly probes: ReadonlyArray<string>
    /** True while the lesson is being written. */
    readonly comingSoon: boolean
}

/** A milestone in the catalog. */
export interface CatalogMilestoneView {
    /** The milestone id. */
    readonly id: string
    /** The title in the locale. */
    readonly title: string
    /** The concept ids in order. */
    readonly concepts: ReadonlyArray<string>
    /** Whether a learner without Premium may open it. */
    readonly free: boolean
}

/** What the new-project screen and the milestone pickers read. */
export interface ProjectCatalogView {
    /** The milestones. */
    readonly milestones: ReadonlyArray<CatalogMilestoneView>
    /** The concepts. */
    readonly concepts: ReadonlyArray<CatalogConceptView>
    /** How many projects a learner without Premium may own. */
    readonly freeProjects: number
}

/** What a proved concept hands the rest of the app. */
export interface ProvedConceptView {
    /** The project. */
    readonly projectId: string
    /** The concept. */
    readonly conceptId: string
    /** When it was first proved. */
    readonly provedAt: string
}

/** What a deleted project answers. */
export interface ProjectDeletedView {
    /** The id of the project that was deleted. */
    readonly id: string
}
