import { Test } from "@nestjs/testing"
import {
    demoFilesOf,
    demoLocaleFilesOf,
    demoRootOf,
    demoSectionsOf,
    separatorTextOf,
    sourceFileOf,
} from "@tests/fixtures/builders/lesson.builder"
import { readLessonSource } from "./lesson-source.policy"

const SOURCE_POLICY: unique symbol = Symbol("lesson.source-policy")

const build = async (): Promise<typeof readLessonSource> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SOURCE_POLICY, useFactory: () => readLessonSource }],
    }).compile()
    return moduleRef.get<typeof readLessonSource>(SOURCE_POLICY)
}

const without = (path: string) => demoFilesOf().filter((file) => file.path !== path)

describe("readLessonSource", () => {
    it("reads both locales with typed root fields and the sections in learning order", async () => {
        const read = await build()
        const result = read(demoFilesOf())

        expect(result.issues).toEqual([])
        expect(result.parsed?.vi.root.title).toBe("vi: Demo lesson")
        expect(result.parsed?.en.root.minutesRead).toBe(95)
        expect(result.parsed?.vi.root.workspace?.commands).toEqual({ windows: "node --test workspace/source.test.ts" })
        expect(result.parsed?.en.sections.map((section) => section.id)).toEqual([
            "0-interview",
            "1-prediction",
            "2-experiment",
            "3-theory",
            "4-practice",
            "5-reflection",
        ])
        expect(result.parsed?.vi.sections[0]?.activities?.[0]?.id).toBe("demo--interview")
        expect(result.parsed?.vi.sections[3]?.activities).toBeUndefined()
    })

    it("orders sections of the same position by their folder name", async () => {
        const read = await build()
        const tied = demoSectionsOf("vi").map((section) => ({ ...section, sortIndex: 1 }))
        const files = [...demoLocaleFilesOf("vi", demoRootOf("vi"), tied), ...demoLocaleFilesOf("en")]

        expect(read(files).parsed?.vi.sections.map((section) => section.id)).toEqual([
            "0-interview",
            "1-prediction",
            "2-experiment",
            "3-theory",
            "4-practice",
            "5-reflection",
        ])
    })

    it("names a locale file that is missing and answers no parsed source", async () => {
        const read = await build()
        const result = read(without("vi.md"))

        expect(result.parsed).toBeNull()
        expect(result.issues).toEqual([{ path: "vi.md", field: "", message: "is missing" }])
    })

    it("names a section file that one locale lacks", async () => {
        const read = await build()
        const result = read(without("sections/3-theory/en.md"))

        expect(result.parsed).toBeNull()
        expect(result.issues).toEqual([{ path: "sections/3-theory/en.md", field: "", message: "is missing" }])
    })

    it("refuses a folder that holds no section", async () => {
        const read = await build()
        const result = read(demoFilesOf().filter((file) => !file.path.startsWith("sections/")))

        expect(result.parsed).toBeNull()
        expect(result.issues[0]).toEqual({ path: "sections", field: "", message: "holds no section" })
    })
})

describe("readLessonSource issues", () => {
    it("names a layout problem of the separator format with the file it is in", async () => {
        const read = await build()
        const broken = sourceFileOf("sections/3-theory/vi.md", "stray text\n")
        const files = [...without("sections/3-theory/vi.md"), broken]

        expect(read(files).issues).toEqual([
            { path: "sections/3-theory/vi.md", field: "", message: "line 1: text outside a field" },
        ])
    })

    it("names a number field that is not a whole number and a json field that does not parse", async () => {
        const read = await build()
        const root = separatorTextOf({ ...demoRootOf("vi"), minutesRead: "ninety", references: "[oops" })
        const files = [...without("vi.md"), sourceFileOf("vi.md", root)]
        const issues = read(files).issues

        expect(issues.map((issue) => `${issue.path} ${issue.field} ${issue.message.split(":")[0]}`)).toEqual([
            "vi.md minutesRead expected a whole number",
            "vi.md references is not valid json",
        ])
    })

    it("names a field of a root file and of a section file that departs from the content format", async () => {
        const read = await build()
        const root = separatorTextOf({ ...demoRootOf("vi"), category: "cooking" })
        const sectionFields = { title: "t", phase: "finale", sortIndex: 3, body: "b" }
        const files = [
            ...without("vi.md").filter((file) => file.path !== "sections/3-theory/en.md"),
            sourceFileOf("vi.md", root),
            sourceFileOf("sections/3-theory/en.md", separatorTextOf(sectionFields)),
        ]

        expect(read(files).issues).toEqual([
            {
                path: "vi.md",
                field: "category",
                message:
                    "expected one of backend, frontend, system-design, testing, devops, cloud, ai-harness, security",
            },
            {
                path: "sections/3-theory/en.md",
                field: "phase",
                message: "expected one of challenge, predict, explore, explain, apply, reflect",
            },
        ])
    })
})

describe("readLessonSource workspaces", () => {
    const rootsWith = (workspaces: ReadonlyArray<object>) =>
        (["vi", "en"] as const).flatMap((locale) =>
            demoLocaleFilesOf(
                locale,
                { ...demoRootOf(locale), workspaces, status: "draft", author: "ai-placeholder" },
                demoSectionsOf(locale),
            ),
        )

    it("reads the languages of the workspaces field and tolerates the status and author sections", async () => {
        const read = await build()
        const declared = [{ language: "csharp", runtime: ".NET 8", files: [], commands: {} }]
        const result = read(rootsWith(declared))

        expect(result.issues).toEqual([])
        expect(result.parsed?.vi.root.workspaces?.[0]?.language).toBe("csharp")
    })

    it("names a language outside the four", async () => {
        const read = await build()
        const result = read(rootsWith([{ language: "cobol", runtime: "x", files: [], commands: {} }]))

        expect(result.parsed).toBeNull()
        expect(result.issues[0]?.field).toContain("workspaces")
    })
})
