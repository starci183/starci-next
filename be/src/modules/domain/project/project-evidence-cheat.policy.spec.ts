import { evidenceOf } from "@tests/fixtures/builders/project.builder"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import {
    SLOT_PROOF_SOURCES,
    type ConceptDefinition,
    type EvidenceRow,
    type EvidenceSlot,
    type EvidenceSource,
} from "./project.contracts"
import { conceptOf, PROJECT_CONCEPTS } from "./project-catalog.policy"
import { catalogIssuesOf, requiredGroupsOf } from "./project-catalog-rules.policy"
import { conceptStandingOf, projectStandingOf } from "./project-state.policy"

const at = (minute: number): Date => new Date(Date.UTC(2026, 10, 8, 9, minute))

const definitionOf = (id: string) => {
    const definition = conceptOf(id)
    if (definition === null) throw new ProjectError({ code: ProjectErrorCode.ConceptNotFound })
    return definition
}

/** A result of a concept; `source` and `slot` are the learner's to choose, so the specs choose them badly too. */
const rowOf = (
    conceptId: string,
    slot: EvidenceSlot,
    source: EvidenceSource,
    patch: Partial<EvidenceRow> = {},
): EvidenceRow => evidenceOf({ conceptId, slot, source, runId: `${source}-${slot}`, ref: `${slot}-ref`, ...patch })

const stateOf = (conceptId: string, rows: ReadonlyArray<EvidenceRow>) =>
    conceptStandingOf(definitionOf(conceptId), rows, false).state

/** A behaviour concept with an HTTP surface: a test or an e2e flow, and a probe. */
const BEHAVIOUR = "idempotency"
/** A behaviour concept with no HTTP surface: an e2e flow and the code read. */
const NO_HTTP = "verify"
/** A structure concept: a test and the code read. */
const STRUCTURE = "saga"

describe("a learner who fakes the evidence", () => {
    it("never proves a behaviour concept with green fake tests while the server probe is red", () => {
        const rows = [
            rowOf(BEHAVIOUR, "test", "ci", { at: at(1) }),
            rowOf(BEHAVIOUR, "e2e", "ci", { at: at(1) }),
            rowOf(BEHAVIOUR, "probe", "server-probe", { passed: false, at: at(2) }),
        ]

        expect(stateOf(BEHAVIOUR, rows)).toBe("practising")
    })

    it("never proves it with green tests and no probe at all", () => {
        expect(stateOf(BEHAVIOUR, [rowOf(BEHAVIOUR, "test", "ci"), rowOf(BEHAVIOUR, "e2e", "ci")])).toBe("practising")
    })

    it("takes the newest probe run, so a red probe after a green one withdraws the proof", () => {
        const green = [
            rowOf(BEHAVIOUR, "test", "ci", { at: at(1) }),
            rowOf(BEHAVIOUR, "probe", "server-probe", { runId: "p1", at: at(2) }),
        ]
        const red = rowOf(BEHAVIOUR, "probe", "server-probe", { runId: "p2", passed: false, at: at(3) })

        expect(stateOf(BEHAVIOUR, green)).toBe("proved")
        expect(stateOf(BEHAVIOUR, [...green, red])).toBe("practising")
    })

    it("does not let one green probe row hide a red row of the same run", () => {
        const rows = [
            rowOf(BEHAVIOUR, "test", "ci"),
            rowOf(BEHAVIOUR, "probe", "server-probe", { runId: "p1", ref: "replay", at: at(2) }),
            rowOf(BEHAVIOUR, "probe", "server-probe", { runId: "p1", ref: "parallel", passed: false, at: at(2) }),
        ]

        expect(stateOf(BEHAVIOUR, rows)).toBe("practising")
    })

    it("does not let a green test hide a red e2e flow of the same concept", () => {
        const test = rowOf(BEHAVIOUR, "test", "ci")
        const probe = rowOf(BEHAVIOUR, "probe", "server-probe")
        const redFlow = rowOf(BEHAVIOUR, "e2e", "ci", { passed: false })

        expect(stateOf(BEHAVIOUR, [test, redFlow, probe])).toBe("practising")
        expect(stateOf(BEHAVIOUR, [test, probe])).toBe("proved")
    })

    it("treats every result from the learner machine or unattested CI as practice, however green", () => {
        const sources: ReadonlyArray<EvidenceSource> = ["relay", "ci-signed"]
        sources.forEach((source) => {
            const behaviour = [
                rowOf(BEHAVIOUR, "test", source),
                rowOf(BEHAVIOUR, "e2e", source),
                rowOf(BEHAVIOUR, "probe", source),
            ]
            const structure = [rowOf(STRUCTURE, "test", source), rowOf(STRUCTURE, "code-read", source)]

            expect(stateOf(BEHAVIOUR, behaviour)).toBe("practising")
            expect(stateOf(STRUCTURE, structure)).toBe("practising")
        })
    })

    it("does not take a probe from CI, even attested: a learner's CI can probe a fake local server", () => {
        const rows = [rowOf(BEHAVIOUR, "test", "ci"), rowOf(BEHAVIOUR, "probe", "ci")]

        expect(stateOf(BEHAVIOUR, rows)).toBe("practising")
    })

    it("takes proof for a slot only from the source that may prove it", () => {
        const wrong: ReadonlyArray<[EvidenceSlot, EvidenceSource]> = [
            ["test", "server-probe"],
            ["test", "ai"],
            ["e2e", "ai"],
            ["probe", "ai"],
            ["code-read", "ci"],
            ["code-read", "server-probe"],
        ]
        wrong.forEach(([slot, source]) => {
            expect(SLOT_PROOF_SOURCES[slot]).not.toContain(source)
        })
        const forgedBehaviour = [rowOf(BEHAVIOUR, "test", "ai"), rowOf(BEHAVIOUR, "probe", "ai")]
        const forgedStructure = [rowOf(STRUCTURE, "test", "server-probe"), rowOf(STRUCTURE, "code-read", "ci")]

        expect(stateOf(BEHAVIOUR, forgedBehaviour)).not.toBe("proved")
        expect(stateOf(STRUCTURE, forgedStructure)).not.toBe("proved")
    })

    it("needs the code read as well as the test for a structure concept", () => {
        const test = rowOf(STRUCTURE, "test", "ci")
        const read = rowOf(STRUCTURE, "code-read", "ai")

        expect(stateOf(STRUCTURE, [test])).toBe("practising")
        expect(stateOf(STRUCTURE, [read])).toBe("practising")
        expect(stateOf(STRUCTURE, [test, rowOf(STRUCTURE, "code-read", "ai", { passed: false })])).toBe("practising")
        expect(stateOf(STRUCTURE, [test, read])).toBe("proved")
    })

    it("needs the e2e flow and the code read for a concept with no HTTP surface, and a test alone is not enough", () => {
        const e2e = rowOf(NO_HTTP, "e2e", "ci")
        const read = rowOf(NO_HTTP, "code-read", "ai")

        expect(stateOf(NO_HTTP, [rowOf(NO_HTTP, "test", "ci"), read])).toBe("practising")
        expect(stateOf(NO_HTTP, [e2e])).toBe("practising")
        expect(stateOf(NO_HTTP, [e2e, read])).toBe("proved")
    })

    it("does not complete a milestone from a concept whose probe is red", () => {
        const lessons = new Set(PROJECT_CONCEPTS.map((concept) => concept.id))
        const fakes = ["request-response-lifecycle", "health-probe-semantics", "unit-testing-behavior"].flatMap((id) =>
            definitionOf(id).requires.flatMap((group) =>
                group.slice(0, 1).map((slot) => rowOf(id, slot, SLOT_PROOF_SOURCES[slot][0] ?? "ci")),
            ),
        )
        const redProbes = fakes.map((row) => (row.slot === "probe" ? { ...row, passed: false } : row))

        const green = projectStandingOf("app", fakes, lessons)
        const red = projectStandingOf("app", redProbes, lessons)

        expect(green.milestones[0]?.state).toBe("done")
        expect(red.milestones[0]?.state).toBe("in-progress")
        expect(red.provedConceptIds).toEqual(["unit-testing-behavior"])
    })
})

describe("the proof model is data in the catalog", () => {
    it("reads the requirement from `requires` for every concept, whatever its id", () => {
        const renamed: ConceptDefinition = {
            ...definitionOf(BEHAVIOUR),
            id: "brand-new-concept",
            requires: [["e2e"], ["code-read"]],
        }
        const rows = [rowOf("brand-new-concept", "e2e", "ci"), rowOf("brand-new-concept", "code-read", "ai")]

        expect(conceptStandingOf(renamed, rows, false).state).toBe("proved")
        expect(conceptStandingOf(renamed, rows.slice(0, 1), false).state).toBe("practising")
    })

    it("keeps every concept of the catalog to the rules of the model", () => {
        expect(catalogIssuesOf(PROJECT_CONCEPTS)).toEqual([])
    })

    it("names the requirement a concept's kind and surface give", () => {
        expect(requiredGroupsOf(definitionOf(BEHAVIOUR))).toEqual(["e2e|test", "probe"])
        expect(requiredGroupsOf(definitionOf(NO_HTTP))).toEqual(["e2e", "code-read"])
        expect(requiredGroupsOf(definitionOf(STRUCTURE))).toEqual(["test", "code-read"])
    })

    it("catches a catalog entry that is too easy or can never be proved", () => {
        const behaviour = definitionOf(BEHAVIOUR)
        const issues = catalogIssuesOf([
            { ...behaviour, id: "tests-only", requires: [["test", "e2e"]] },
            { ...behaviour, id: "no-probe-named", probes: [] },
            { ...definitionOf(NO_HTTP), id: "probe-on-no-http", requires: [["e2e"], ["probe"], ["code-read"]] },
            { ...definitionOf(STRUCTURE), id: "read-only", requires: [["code-read"]] },
        ])

        const byConcept = (id: string) => issues.filter((issue) => issue.concept === id).map((issue) => issue.message)
        expect(byConcept("tests-only")[0]).toContain("probe")
        expect(byConcept("no-probe-named")).toEqual(["has an HTTP surface but names no probe"])
        expect(byConcept("probe-on-no-http")).toEqual(["has no HTTP surface but requires a probe"])
        expect(byConcept("read-only")[0]).toContain("test")
    })
})
