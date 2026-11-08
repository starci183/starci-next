import { Test } from "@nestjs/testing"
import { PATH_IDS, PATH_PARTS, PATH_STAGES } from "./path.contracts"
import { definitionOf, PATH_DEFINITIONS, textFrom } from "./path-catalog.policy"

const POLICY = Symbol("path-catalog-policy")

const policies = { definitionOf, PATH_DEFINITIONS, textFrom }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

describe("the path catalog", () => {
    it("lists the five paths of the program, each once and in the stable order", async () => {
        const { PATH_DEFINITIONS: definitions } = await build()

        expect(definitions.map((definition) => definition.id)).toEqual([...PATH_IDS])
    })

    it("gives every path a promise, a done outcome and checks in both locales, and a self-reported outcome last", async () => {
        const { PATH_DEFINITIONS: definitions } = await build()

        for (const definition of definitions) {
            for (const line of [definition.title, definition.pitch, definition.done]) {
                expect(line.vi).not.toBe("")
                expect(line.en).not.toBe("")
                expect(line.vi).not.toMatch(/^[a-z-]+\.(title|pitch|done)$/u)
                expect(line.en).not.toMatch(/^[a-z-]+\.(title|pitch|done)$/u)
            }
            expect(definition.checks.length).toBeGreaterThanOrEqual(3)
            for (const check of definition.checks) {
                expect(check.text.vi).not.toMatch(/^[a-z-]+\.check\.\d$/u)
                expect(check.text.en).not.toMatch(/^[a-z-]+\.check\.\d$/u)
            }
            expect(definition.checks.filter((check) => check.selfReported)).toHaveLength(1)
            expect(definition.checks.at(-1)?.selfReported).toBe(true)
            expect(definition.weeks).toBeGreaterThan(0)
        }
    })

    it("keeps step ids unique inside a path, steps on known stages and parts, and stages in the program order", async () => {
        const { PATH_DEFINITIONS: definitions } = await build()

        for (const definition of definitions) {
            const ids = definition.steps.map((step) => step.id)
            expect(new Set(ids).size).toBe(ids.length)
            const order = definition.steps.map((step) => PATH_STAGES.indexOf(step.stage))
            expect(order.every((position) => position >= 0)).toBe(true)
            expect(order).toEqual([...order].sort((left, right) => left - right))
            for (const step of definition.steps) {
                expect(PATH_PARTS).toContain(step.part)
                expect(step.title.vi).not.toContain(".step.")
                expect(step.title.en).not.toContain(".step.")
            }
            expect(definition.steps.at(-1)?.part).toBe("profile")
        }
    })

    it("shows the key of a text the message file does not have, so a gap is visible and never blank", async () => {
        const { textFrom } = await build()

        expect(textFrom({ vi: {}, en: {} }, "founder.title")).toEqual({ vi: "founder.title", en: "founder.title" })
    })

    it("finds a path by id and nothing for an unknown id", async () => {
        const policy = await build()

        expect(policy.definitionOf("devops-sre")?.title.en).toBe("DevOps / SRE")
        expect(policy.definitionOf("nope")).toBeNull()
    })
})
