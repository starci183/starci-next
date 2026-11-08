import { isRecord } from "@modules/platform/primitives"
import {
    AGENT_TRACKS,
    EVIDENCE_SLOTS,
    EVIDENCE_SOURCES,
    PROJECT_KINDS,
    type ConceptLessonRef,
    type EvidenceRow,
    type EvidenceSlot,
    type ProjectKind,
    type ProjectLocale,
    type SlotState,
} from "./project.contracts"
import {
    type CiRunView,
    type ConceptView,
    type FactView,
    type FailureView,
    type MilestoneSummaryView,
    type ProbeResultView,
    type ProbeRunView,
    type ProjectSummaryView,
    type SlotView,
} from "./project-view.contracts"
import { probeQuestionOf } from "./project-probe.policy"
import type {
    MilestoneStanding,
    ConceptStanding,
    ProjectStanding,
    SlotResult,
    SlotStanding,
} from "./project-state.policy"
import type { CiRunRow, ConceptRow, EvidenceDbRow, ProbeRunRow, ProjectRow } from "./persistence/project.rows"

/** The evidence rows the database answered, with the rows whose slot or source the capability does not know left out. */
export const toEvidenceRows = (rows: ReadonlyArray<EvidenceDbRow>): ReadonlyArray<EvidenceRow> =>
    rows.flatMap((row) => {
        const slot = EVIDENCE_SLOTS.find((candidate) => candidate === row.slot)
        const source = EVIDENCE_SOURCES.find((candidate) => candidate === row.source)
        return slot === undefined || source === undefined
            ? []
            : [
                  {
                      projectId: row.project_id,
                      conceptId: row.concept_id,
                      slot,
                      source,
                      passed: row.passed,
                      ref: row.ref,
                      runId: row.run_id,
                      commitSha: row.commit_sha,
                      detail: row.detail,
                      at: row.at,
                  },
              ]
    })

/** A text fact of a result's detail, or an empty string. */
const detailText = (detail: Readonly<Record<string, unknown>>, key: string): string => {
    const value = detail[key]
    return typeof value === "string" ? value : ""
}

/** The facts of a result's detail as short key-value pairs. */
export const factsOf = (detail: Readonly<Record<string, unknown>>): ReadonlyArray<FactView> => {
    const facts: unknown = detail["facts"]
    return isRecord(facts)
        ? Object.entries(facts).flatMap(([key, value]) =>
              typeof value === "string" || typeof value === "number" ? [{ key, value: String(value) }] : [],
          )
        : []
}

const shortCommit = (commit: string): string => commit.slice(0, 7)

/** The kind of a stored project; the database allows only the two kinds, so any other text reads as an app. */
export const projectKindOf = (row: ProjectRow): ProjectKind => PROJECT_KINDS.find((kind) => kind === row.kind) ?? "app"

/** The project as the list shows it. */
export const toSummaryView = (row: ProjectRow, standing: ProjectStanding): ProjectSummaryView => ({
    id: row.project_id,
    name: row.name,
    kind: projectKindOf(row),
    topic: row.topic,
    language: row.language,
    stack: row.stack,
    track: AGENT_TRACKS.find((track) => track === row.track) ?? null,
    repoUrl: row.repo_url,
    deployedUrl: row.deployed_url,
    provedConceptCount: standing.provedConceptIds.length,
    conceptCount: standing.conceptCount,
    currentMilestoneId: standing.currentMilestoneId,
    doneMilestoneCount: standing.milestones.filter((milestone) => milestone.state === "done").length,
    milestoneCount: standing.milestones.length,
    createdAt: row.created_at.toISOString(),
})

/** A milestone as a pill of the project page. */
export const toMilestoneSummaryView = (
    milestone: MilestoneStanding,
    locale: ProjectLocale,
    locked: boolean,
): MilestoneSummaryView => ({
    id: milestone.definition.id,
    title: milestone.definition.title[locale],
    conceptCount: milestone.concepts.length,
    provedCount: milestone.concepts.filter((concept) => concept.state === "proved").length,
    state: milestone.state,
    locked,
})

/** The result a slot shows: the newest of the practice and the proof result. */
const shownResult = (standing: SlotStanding): SlotResult | null => {
    const { practice, proof } = standing
    return practice !== null && (proof === null || practice.at > proof.at) ? practice : proof
}

const slotStateOf = (shown: SlotResult | null): SlotState => {
    if (shown === null) return "pending"
    return shown.passed ? "pass" : "fail"
}

const toSlotView = (standing: SlotStanding, required: boolean): SlotView => {
    const shown = shownResult(standing)
    return {
        slot: standing.slot,
        required,
        state: slotStateOf(shown),
        proof: standing.proof?.passed === true,
        source: shown?.source ?? null,
        ref: shown?.ref ?? null,
        at: shown?.at.toISOString() ?? null,
    }
}

/** The question the AI teacher asks about a failed result: a probe has a fixed one, a code read carries its own. */
const questionOf = (slot: EvidenceSlot, shown: SlotResult, locale: ProjectLocale): string => {
    if (slot === "probe") return probeQuestionOf(shown.ref, locale)
    return slot === "code-read" ? detailText(shown.detail, "question") : ""
}

/** The latest failing result among a concept's slots, with the question the AI teacher asks. */
const failureOf = (standing: ConceptStanding, locale: ProjectLocale): FailureView | null => {
    const failing = standing.slots.flatMap((slot) => {
        const shown = shownResult(slot)
        return shown !== null && !shown.passed ? [{ slot: slot.slot, shown }] : []
    })
    const newest = failing.reduce<(typeof failing)[number] | null>(
        (best, candidate) => (best === null || candidate.shown.at > best.shown.at ? candidate : best),
        null,
    )
    if (newest === null) return null
    const { slot, shown } = newest
    const reasons = {
        test: "test-failed",
        e2e: "e2e-failed",
        probe: "probe-failed",
        "code-read": "code-read-below-bar",
    } as const
    const probeId = slot === "probe" ? shown.ref : null
    const question = questionOf(slot, shown, locale)
    const facts = factsOf(shown.detail)
    return {
        slot,
        probeId,
        reason: detailText(shown.detail, "reason") || reasons[slot],
        facts: slot === "test" || slot === "e2e" ? [{ key: "ref", value: shown.ref }, ...facts] : facts,
        question,
    }
}

/** One concept of a milestone in a project. */
export const toConceptView = (
    standing: ConceptStanding,
    pointer: ConceptRow | undefined,
    lesson: ConceptLessonRef | undefined,
    locale: ProjectLocale,
): ConceptView => {
    const codeRead = standing.slots.find((slot) => slot.slot === "code-read")
    const question = detailText(codeRead?.proof?.detail ?? {}, "question")
    const { definition } = standing
    return {
        id: definition.id,
        label: definition.label[locale],
        kind: definition.kind,
        state: standing.state,
        comingSoon: lesson === undefined,
        lesson: lesson === undefined ? null : { id: lesson.id, topicId: lesson.topicId, title: lesson.title },
        location: pointer?.location ?? null,
        endpoint: pointer?.endpoint ?? null,
        sampleBody: pointer?.sample_body ?? null,
        slots: standing.slots.map((slot) =>
            toSlotView(
                slot,
                definition.requires.some((group) => group.includes(slot.slot)),
            ),
        ),
        failing: failureOf(standing, locale),
        aiQuestion: question === "" ? null : question,
    }
}

/** The last signed CI run. */
export const toCiRunView = (row: CiRunRow): CiRunView => ({
    runId: row.run_id,
    commit: shortCommit(row.commit_sha),
    passed: row.passed,
    at: row.received_at.toISOString(),
})

const toProbeResultView = (result: Readonly<Record<string, unknown>>): ProbeResultView => ({
    probeId: detailText(result, "probeId"),
    conceptId: detailText(result, "conceptId") || null,
    passed: result["passed"] === true,
    reason: detailText(result, "reason"),
    facts: factsOf(result),
})

/** The last probe run. */
export const toProbeRunView = (row: ProbeRunRow): ProbeRunView => ({
    runId: row.run_id,
    url: row.url,
    passed: row.passed,
    results: row.results.map((result) => toProbeResultView(result)),
    at: row.at.toISOString(),
})
