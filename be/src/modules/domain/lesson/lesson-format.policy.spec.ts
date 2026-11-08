import { Test } from "@nestjs/testing"
import { demoRootOf, demoSectionsOf } from "@tests/fixtures/builders/lesson.builder"
import {
    LESSON_CATEGORIES,
    LESSON_PHASES,
    ROOT_SHAPE,
    SECTION_SHAPE,
    isRootFile,
    isSectionFile,
    rootIssues,
    sectionIssues,
} from "./lesson-format.policy"

const POLICY: unique symbol = Symbol("spec.lesson-format-policy")
const policy = { isRootFile, isSectionFile, rootIssues, sectionIssues }

const build = async (): Promise<typeof policy> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policy }],
    }).compile()
    return moduleRef.get(POLICY)
}

describe("lesson format policy", () => {
    it("names the categories and phases of the format and uses them in the shapes", () => {
        expect(LESSON_CATEGORIES).toContain("backend")
        expect(LESSON_PHASES).toEqual(["challenge", "predict", "explore", "explain", "apply", "reflect"])
        expect(ROOT_SHAPE.required["category"]).toEqual({ oneOf: LESSON_CATEGORIES })
        expect(SECTION_SHAPE.required["phase"]).toEqual({ oneOf: LESSON_PHASES })
    })

    it("accepts the root file and the section files of a demo lesson", async () => {
        const { isRootFile: isRoot, isSectionFile: isSection, rootIssues: root, sectionIssues: section } = await build()

        expect(isRoot(demoRootOf("vi"))).toBe(true)
        expect(root(demoRootOf("en"))).toEqual([])
        demoSectionsOf("vi").forEach((file) => {
            expect(isSection(file)).toBe(true)
            expect(section(file)).toEqual([])
        })
    })

    it("lists where a root file departs from the format", async () => {
        const { isRootFile: isRoot, rootIssues: root } = await build()
        const broken = { ...demoRootOf("vi"), category: "cooking", minutesRead: 0 }

        expect(isRoot(broken)).toBe(false)
        expect(root(broken).map((item) => item.field)).toEqual(expect.arrayContaining(["category", "minutesRead"]))
        expect(root(null)).toEqual([{ field: "", message: "expected an object" }])
    })

    it("lists where a section file departs from the format", async () => {
        const { isSectionFile: isSection, sectionIssues: section } = await build()
        const [first] = demoSectionsOf("vi")
        const broken = { ...first, phase: "nap", sortIndex: -1 }

        expect(isSection(broken)).toBe(false)
        expect(section(broken).map((item) => item.field)).toEqual(expect.arrayContaining(["phase", "sortIndex"]))
    })
})
