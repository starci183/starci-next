import { fixtureCheckSet } from "@tests/fixtures/builders/check-set.builder"
import type { ConceptDefinition } from "./project.contracts"
import {
    conceptIdsOfKind,
    conceptIn,
    isComingSoon,
    isListed,
    learnLessonOf,
    milestoneIn,
    milestonesOfKind,
} from "./project-check-set-lookup.policy"

const SET = fixtureCheckSet()

const concept = (patch: Partial<ConceptDefinition>): ConceptDefinition => ({
    id: "c",
    label: { vi: "c", en: "c" },
    kind: "structure",
    http: false,
    requires: [["test"], ["code-read"]],
    probes: [],
    learn: [],
    ...patch,
})

describe("the lookups of a check set", () => {
    it("lists the milestones and the concept ids of each kind of project, in catalog order, each concept once", () => {
        expect(milestonesOfKind(SET, "app").map((milestone) => milestone.id)).toEqual([
            "bf-http-foundation",
            "bf-data-and-cache",
            "bf-safe-and-reliable",
        ])
        expect(milestonesOfKind(SET, "agent")[1]?.id).toBe("agent-mindset")
        const ids = conceptIdsOfKind(SET, "app")
        expect(new Set(ids).size).toBe(ids.length)
        expect(ids).toContain("idempotent-retry")
        expect(ids).not.toContain("task-spec")
    })

    it("finds a concept or a milestone by id, and says whether a kind of project lists a concept", () => {
        expect(conceptIn(SET, "rate-limiting")?.kind).toBe("behaviour")
        expect(conceptIn(SET, "nope")).toBeNull()
        expect(milestoneIn(SET, "bf-data-and-cache")?.concepts).toContain("cache-freshness")
        expect(milestoneIn(SET, "nope")).toBeNull()
        expect(isListed(SET, "app", "rate-limiting")).toBe(true)
        expect(isListed(SET, "app", "task-spec")).toBe(false)
        expect(isListed(SET, "agent", "task-spec")).toBe(true)
    })
})

describe("the lesson behind a concept", () => {
    it("is the first learn link whose lesson is live, else the lesson that carries the concept's own id, else none", () => {
        const linked = concept({
            id: "x",
            learn: [
                { lesson: "pending-one", pending: true },
                { lesson: "live-one", pending: false },
            ],
        })

        expect(learnLessonOf(linked, new Set(["live-one", "x"]))).toBe("live-one")
        expect(learnLessonOf(linked, new Set(["x"]))).toBe("x")
        expect(learnLessonOf(linked, new Set())).toBeNull()
    })

    it("is coming soon only for a concept that needs the AI read and has no lesson to grade it against", () => {
        const needsRead = concept({ id: "r" })
        const behaviour = concept({ id: "b", kind: "behaviour", http: true, requires: [["test", "e2e"], ["probe"]] })

        expect(isComingSoon(needsRead, new Set())).toBe(true)
        expect(isComingSoon(needsRead, new Set(["r"]))).toBe(false)
        expect(isComingSoon(behaviour, new Set())).toBe(false)
    })
})
