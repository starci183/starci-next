import { Test } from "@nestjs/testing"
import { groupOf } from "./lesson-group.policy"

const GROUP_POLICY: unique symbol = Symbol("lesson.group-policy")

const build = async (): Promise<typeof groupOf> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: GROUP_POLICY, useFactory: () => groupOf }],
    }).compile()
    return moduleRef.get<typeof groupOf>(GROUP_POLICY)
}

describe("groupOf", () => {
    it.each([
        ["request-response-lifecycle", "backend", "backend"],
        ["server-state-cache-lifecycle", "frontend", "frontend"],
        ["cqrs-read-models", "system-design", "distributed"],
        ["unit-testing-behavior", "testing", "testing"],
        ["health-probe-semantics", "devops", "infra"],
        ["vpc-routing", "cloud", "cloud"],
        ["agent-harness-control-loop", "ai-harness", "ai"],
    ])("places the lesson %s of category %s in %s by its own entry", async (id, category, group) => {
        const place = await build()

        expect(place(id, category)).toBe(group)
    })

    it.each([
        ["backend", "backend"],
        ["frontend", "frontend"],
        ["testing", "testing"],
        ["cloud", "cloud"],
        ["ai-harness", "ai"],
    ])("places a lesson with no entry of category %s in %s", async (category, group) => {
        const place = await build()

        expect(place("some-new-lesson", category)).toBe(group)
    })

    it.each(["system-design", "devops", "security"])(
        "refuses to place a lesson of category %s with no entry",
        async (category) => {
            const place = await build()

            expect(place("some-new-lesson", category)).toBeNull()
        },
    )

    it("prefers the entry of the lesson over the group of its category", async () => {
        const place = await build()

        expect(place("vpc-routing", "backend")).toBe("cloud")
    })
})
