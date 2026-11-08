import {
    EVIDENCE_SLOTS,
    PRACTICE_SOURCES,
    PROOF_SOURCES,
    type ConceptDefinition,
    type ConceptState,
    type EvidenceRow,
    type EvidenceSlot,
    type EvidenceSource,
    type MilestoneDefinition,
    type MilestoneState,
    type ProjectKind,
} from "./project.contracts"
import { milestonesOfKind, PROJECT_CONCEPTS } from "./project-catalog.policy"

/** The latest run of one source for a slot, reduced to a verdict. */
export interface SlotResult {
    /** Whether every result of that run passed. */
    readonly passed: boolean
    /** The source of the run. */
    readonly source: EvidenceSource
    /** The ref of the first failing result, else of the first result. */
    readonly ref: string
    /** The run id. */
    readonly runId: string
    /** The commit of the run, or null. */
    readonly commitSha: string | null
    /** When the run produced its latest result. */
    readonly at: Date
    /** The facts of the shown result. */
    readonly detail: Readonly<Record<string, unknown>>
}

/** Where one slot of a concept stands: the latest practice result (relay) and the latest proof result (CI, server probe, AI). */
export interface SlotStanding {
    /** The slot. */
    readonly slot: EvidenceSlot
    /** The latest result from the learner machine, or null. */
    readonly practice: SlotResult | null
    /** The latest result from proof sources, or null. */
    readonly proof: SlotResult | null
}

/** Where a concept stands in a project. */
export interface ConceptStanding {
    /** The concept. */
    readonly definition: ConceptDefinition
    /** Todo, practising or proved. */
    readonly state: ConceptState
    /** The slots the concept can show, in order. */
    readonly slots: ReadonlyArray<SlotStanding>
}

const latestRunOf = (rows: ReadonlyArray<EvidenceRow>, source: EvidenceSource): SlotResult | null => {
    const own = rows.filter((row) => row.source === source)
    const newest = own.reduce<EvidenceRow | null>((best, row) => (best === null || row.at > best.at ? row : best), null)
    if (newest === null) return null
    const run = own.filter((row) => row.runId === newest.runId)
    const failing = run.find((row) => !row.passed)
    const shown = failing ?? newest
    return {
        passed: failing === undefined,
        source,
        ref: shown.ref,
        runId: newest.runId,
        commitSha: newest.commitSha,
        at: newest.at,
        detail: shown.detail,
    }
}

const newestOf = (results: ReadonlyArray<SlotResult | null>): SlotResult | null =>
    results.reduce<SlotResult | null>((best, result) => {
        if (result === null) return best
        return best === null || result.at > best.at ? result : best
    }, null)

/** The standing of a slot from the concept's evidence rows: the newest run of each proof source, and of the relay. */
export const slotStandingOf = (slot: EvidenceSlot, rows: ReadonlyArray<EvidenceRow>): SlotStanding => {
    const own = rows.filter((row) => row.slot === slot)
    return {
        slot,
        practice: newestOf(PRACTICE_SOURCES.map((source) => latestRunOf(own, source))),
        proof: newestOf(PROOF_SOURCES.map((source) => latestRunOf(own, source))),
    }
}

/** Whether a slot has a passing proof. */
const isProved = (standing: SlotStanding): boolean => standing.proof?.passed === true

/** What decides where a concept stands. */
interface ConceptFacts {
    /** The lesson is still being written. */
    readonly comingSoon: boolean
    /** Every group of the requirement has a passing proof. */
    readonly proved: boolean
    /** Any slot has a result. */
    readonly started: boolean
}

const conceptStateOf = (facts: ConceptFacts): ConceptState => {
    if (facts.comingSoon) return "todo"
    if (facts.proved) return "proved"
    return facts.started ? "practising" : "todo"
}

/**
 * Where a concept stands. Proved needs, for every group of what the concept requires, one slot whose latest proof result passes
 * (signed CI, a server probe or the AI teacher's read); results from the machine alone leave it practising. A concept whose lesson
 * is still being written stays todo, so it is left out of done.
 */
export const conceptStandingOf = (
    definition: ConceptDefinition,
    rows: ReadonlyArray<EvidenceRow>,
    comingSoon: boolean,
): ConceptStanding => {
    const shown = EVIDENCE_SLOTS.filter((slot) => definition.requires.some((group) => group.includes(slot)))
    const slots = shown.map((slot) => slotStandingOf(slot, rows))
    const standingOf = (slot: EvidenceSlot): SlotStanding | undefined =>
        slots.find((candidate) => candidate.slot === slot)
    const proved = definition.requires.every((group) =>
        group.some((slot) => {
            const standing = standingOf(slot)
            return standing !== undefined && isProved(standing)
        }),
    )
    const started = slots.some((standing) => standing.practice !== null || standing.proof !== null)
    return { definition, state: conceptStateOf({ comingSoon, proved, started }), slots }
}

/** Where a milestone stands: done when every concept with a lesson is proved, in progress once any concept has results. */
export const milestoneStateOf = (
    standings: ReadonlyArray<ConceptStanding>,
    comingSoon: ReadonlySet<string>,
): MilestoneState => {
    const open = standings.filter((standing) => !comingSoon.has(standing.definition.id))
    if (open.length > 0 && open.every((standing) => standing.state === "proved")) return "done"
    return open.some((standing) => standing.state !== "todo") ? "in-progress" : "todo"
}

/** Where one milestone stands in a project. */
export interface MilestoneStanding {
    /** The milestone. */
    readonly definition: MilestoneDefinition
    /** Todo, in progress or done. */
    readonly state: MilestoneState
    /** Its concepts in order. */
    readonly concepts: ReadonlyArray<ConceptStanding>
}

/** Where a whole project stands: every milestone its kind lists, and the concepts proved once across them. */
export interface ProjectStanding {
    /** The milestones in catalog order. */
    readonly milestones: ReadonlyArray<MilestoneStanding>
    /** The ids of the concepts proved, each once. */
    readonly provedConceptIds: ReadonlyArray<string>
    /** How many different concepts the milestones list that have a lesson. */
    readonly conceptCount: number
    /** How many concepts show results from the machine only. */
    readonly practisingConceptIds: ReadonlyArray<string>
    /** The milestone being worked on: the first that is not done, or null. */
    readonly currentMilestoneId: string | null
}

/**
 * Where a project stands, from the latest evidence of all its concepts. A concept appearing in several milestones is graded once
 * (it counts once for the path); the lessons that exist decide which concepts are still being written.
 */
export const projectStandingOf = (
    kind: ProjectKind,
    rows: ReadonlyArray<EvidenceRow>,
    lessonIds: ReadonlySet<string>,
): ProjectStanding => {
    const listed = milestonesOfKind(kind)
    const ids = [...new Set(listed.flatMap((milestone) => milestone.concepts))]
    const standings = new Map(
        PROJECT_CONCEPTS.filter((definition) => ids.includes(definition.id)).map(
            (definition) =>
                [
                    definition.id,
                    conceptStandingOf(
                        definition,
                        rows.filter((row) => row.conceptId === definition.id),
                        !lessonIds.has(definition.id),
                    ),
                ] as const,
        ),
    )
    const comingSoon = new Set(ids.filter((id) => !lessonIds.has(id)))
    const milestones = listed.map((definition) => {
        const concepts = [...standings.values()]
            .filter((standing) => definition.concepts.includes(standing.definition.id))
            .sort((a, b) => definition.concepts.indexOf(a.definition.id) - definition.concepts.indexOf(b.definition.id))
        return { definition, state: milestoneStateOf(concepts, comingSoon), concepts }
    })
    const all = [...standings.values()]
    return {
        milestones,
        provedConceptIds: all
            .filter((standing) => standing.state === "proved")
            .map((standing) => standing.definition.id),
        conceptCount: ids.length - comingSoon.size,
        practisingConceptIds: all
            .filter((standing) => standing.state === "practising")
            .map((standing) => standing.definition.id),
        currentMilestoneId: milestones.find((milestone) => milestone.state !== "done")?.definition.id ?? null,
    }
}
