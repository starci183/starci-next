import { Test } from "@nestjs/testing"
import { PROBE_IDS } from "./project.contracts"
import { PROJECT_CONCEPTS, PROJECT_MILESTONES } from "./project-catalog.policy"
import { conceptOf, milestoneOf, milestonesOfKind } from "./project-catalog.policy"

const POLICY: unique symbol = Symbol("project.project-catalog-policy")
const policies = { conceptOf, milestoneOf, milestonesOfKind }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

describe("the project catalog", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("lists only concepts every milestone can find, each once", () => {
        const ids = PROJECT_CONCEPTS.map((concept) => concept.id)

        expect(new Set(ids).size).toBe(ids.length)
        for (const milestone of PROJECT_MILESTONES) {
            for (const id of milestone.concepts) expect(ids).toContain(id)
        }
    })

    it("uses only probes that exist and gives every behaviour concept a probe and every structure concept the code read", () => {
        for (const concept of PROJECT_CONCEPTS) {
            for (const probe of concept.probes) expect(PROBE_IDS).toContain(probe)
        }
        for (const concept of PROJECT_CONCEPTS.filter((item) => item.kind === "structure")) {
            expect(concept.requires.flat()).toContain(concept.id === "unit-testing-behavior" ? "test" : "code-read")
        }
        expect(subject.conceptOf("idempotency")).toMatchObject({
            kind: "behaviour",
            requires: [["test", "e2e"], ["probe"]],
        })
    })

    it("finds a concept, and a milestone by id, and nothing for an unknown id", () => {
        expect(subject.conceptOf("saga")?.kind).toBe("structure")
        expect(subject.conceptOf("nope")).toBeNull()
        expect(subject.milestoneOf("launch")?.concepts).toEqual([
            "authentication-and-authorization",
            "payment-integration",
            "idempotency",
        ])
        expect(subject.milestoneOf("nope")).toBeNull()
    })

    it("lists the milestones of an app and of an agent in catalog order", () => {
        expect(subject.milestonesOfKind("app").map((milestone) => milestone.id)).toEqual([
            "bf-http-foundation",
            "bf-data-and-cache",
            "bf-safe-and-reliable",
            "ai-coding-mindset",
            "launch",
            "ops-run-a-service",
            "ops-deliver",
            "ops-observe-and-recover",
            "sd-distributed-data",
            "sd-reliable-messaging",
            "sd-scale",
        ])
        expect(subject.milestonesOfKind("agent").map((milestone) => milestone.id)).toEqual([
            "bf-http-foundation",
            "ai-coding-mindset",
            "agent-mindset",
            "agent-theory",
        ])
    })
})
