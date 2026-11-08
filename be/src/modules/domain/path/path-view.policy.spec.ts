import { Test } from "@nestjs/testing"
import { PathError, PathErrorCode } from "./errors/path.error"
import { PATH_COPY } from "./messages/path.messages"
import { definitionOf } from "./path-catalog.policy"
import { activeOf, keyedText, PATH_NEXT_STEPS, PATH_PART_ROUTES, viewOf } from "./path-view.policy"

const POLICY = Symbol("path-view-policy")

const policies = { activeOf, keyedText, viewOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

const definitionFor = (id: string) => {
    const definition = definitionOf(id)
    if (definition === null) throw new PathError({ code: PathErrorCode.NotFound, params: { id } })
    return definition
}

describe("the path view", () => {
    it("words a path in the asked locale", async () => {
        const { viewOf: view } = await build()
        const founder = definitionFor("founder")

        const vi = view(founder, "vi")
        const en = view(founder, "en")

        expect(en.title).toBe("Founder")
        expect(vi.title).toBe(founder.title.vi)
        expect(vi.title).not.toBe(en.title)
        expect(vi.pathId).toBe("founder")
        expect(vi.kind).toBe("build")
        expect(vi.weeks).toBe(16)
        expect(vi.checks.at(-1)).toMatchObject({ selfReported: true })
        expect(en.stages[0]?.title).toBe("Understand")
    })

    it("groups the steps into the stages that have steps, in the program order, each step linking to its part", async () => {
        const { viewOf: view } = await build()

        const result = view(definitionFor("devops-sre"), "en")

        expect(result.stages.map((stage) => stage.stageId)).toEqual([
            "understand",
            "remember",
            "build",
            "build-ai",
            "interview",
            "prove",
        ])
        expect(result.stages.flatMap((stage) => stage.steps)).toHaveLength(result.stepCount)
        for (const step of result.stages.flatMap((stage) => stage.steps))
            expect(step.link).toBe(PATH_PART_ROUTES[step.part])
    })

    it("lists each part once in the order of the app and names it in the asked locale", async () => {
        const { viewOf: view } = await build()

        expect(view(definitionFor("devops-sre"), "en").parts).toEqual([
            { part: "essentials", label: "Essentials" },
            { part: "review", label: "Review" },
            { part: "projects", label: "Projects" },
            { part: "interview", label: "Mock interview" },
            { part: "profile", label: "Profile & CV" },
        ])
        expect(view(definitionFor("backend-fullstack"), "en").parts.map((part) => part.label)).toContain(
            "Code practice",
        )
    })

    it("shows the key of a stage or part the message file does not have, so a gap is visible and never blank", async () => {
        const { keyedText } = await build()

        expect(keyedText({ vi: {}, en: {} }, "part.profile", "en")).toBe("part.profile")
        expect(keyedText(PATH_COPY, "part.profile", "en")).toBe(PATH_COPY.en["part.profile"])
    })

    it("gives the hub the first three steps of the followed path", async () => {
        const { activeOf: active } = await build()
        const founder = definitionFor("founder")

        const result = active(founder, "en")

        expect(result.pathId).toBe("founder")
        expect(result.title).toBe("Founder")
        expect(result.next).toHaveLength(PATH_NEXT_STEPS)
        expect(result.next[0]).toBe(founder.steps[0]?.title.en)
        expect(active(founder, "vi").next[0]).toBe(founder.steps[0]?.title.vi)
    })
})
