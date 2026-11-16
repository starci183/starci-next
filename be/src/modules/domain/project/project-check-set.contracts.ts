import type { CheckFlow } from "@modules/platform/check-flow"
import type { ConceptKind, EvidenceSlot, LocalizedText, ProjectKind } from "./project.contracts"

/** A link from a concept to the Essentials lesson that teaches it. */
export interface CheckLearnLink {
    /** The lesson id. */
    readonly lesson: string
    /** True while the lesson is still on its own content branch. */
    readonly pending: boolean
}

/** One concept of the check set, as the content catalog declares it. */
export interface CheckConcept {
    /** The concept id. */
    readonly id: string
    /** The label. */
    readonly label: LocalizedText
    /** Behaviour or structure. */
    readonly kind: ConceptKind
    /** Whether the concept has an HTTP surface a probe can reach. */
    readonly http: boolean
    /** The evidence it needs: every group, each met by any one of its slots. */
    readonly requires: ReadonlyArray<ReadonlyArray<EvidenceSlot>>
    /** The probe ids. */
    readonly probes: ReadonlyArray<string>
    /** The lessons that teach it. */
    readonly learn: ReadonlyArray<CheckLearnLink>
}

/** One milestone of the check set. */
export interface CheckMilestone {
    /** The milestone id. */
    readonly id: string
    /** The title. */
    readonly title: LocalizedText
    /** The concept ids in order. */
    readonly concepts: ReadonlyArray<string>
}

/** One probe: its flow and the texts the learner sees. */
export interface CheckProbe {
    /** The flow the runner interprets. */
    readonly flow: CheckFlow
    /** The label. */
    readonly label: LocalizedText
    /** The question the AI teacher asks after a failure. */
    readonly question: LocalizedText
    /** The text of every reason code. */
    readonly reasons: Readonly<Record<string, LocalizedText>>
}

/** The whole check set of one content version: data only, no code per check. */
export interface CheckSet {
    /** The content version it was read at. */
    readonly version: string
    /** The concepts in catalog order. */
    readonly concepts: ReadonlyArray<CheckConcept>
    /** The milestones in catalog order. */
    readonly milestones: ReadonlyArray<CheckMilestone>
    /** The milestone ids each project kind lists. */
    readonly kinds: Readonly<Record<ProjectKind, ReadonlyArray<string>>>
    /** The probes by id. */
    readonly probes: ReadonlyMap<string, CheckProbe>
}

/** The raw files of a check set, as the source read them. */
export interface CheckSetFiles {
    /** The content version (a snapshot sha or a directory fingerprint). */
    readonly version: string
    /** The text of `raw/projects/catalog.yaml`. */
    readonly catalog: string
    /** The text of every `raw/projects/probes/<id>.yaml`, by file name. */
    readonly probes: Readonly<Record<string, string>>
}
