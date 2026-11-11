import { Test } from "@nestjs/testing"
import { demoContentOf } from "@tests/fixtures/builders/lesson.builder"
import type { LessonWorkspaceVariant } from "./lesson.contracts"
import type { VersionRow } from "./persistence/lesson.rows"
import { workspaceVariantOf } from "./lesson-workspace.policy"

const WORKSPACE_POLICY: unique symbol = Symbol("lesson.workspace-policy")

const build = async (): Promise<typeof workspaceVariantOf> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: WORKSPACE_POLICY, useFactory: () => workspaceVariantOf }],
    }).compile()
    return moduleRef.get<typeof workspaceVariantOf>(WORKSPACE_POLICY)
}

const variant: LessonWorkspaceVariant = { language: "go", runtime: "go 1.22", files: [], commands: {} }

const rowOf = (workspaces: ReadonlyArray<LessonWorkspaceVariant> | undefined): VersionRow => ({
    lesson_id: "demo-lesson",
    version: "v1",
    category: "backend",
    lesson_group: "core",
    topic: "t",
    topic_title: "T",
    difficulty: "foundation",
    minutes_read: 10,
    implementation: "typescript",
    content: { ...demoContentOf(), ...(workspaces === undefined ? {} : { workspaces }) },
})

describe("workspaceVariantOf", () => {
    it("finds the variant of the language", async () => {
        const variantOf = await build()

        expect(variantOf(rowOf([variant]), "go")).toBe(variant)
    })

    it("is null for a language the lesson does not ship", async () => {
        const variantOf = await build()

        expect(variantOf(rowOf([variant]), "java")).toBeNull()
    })

    it("serves the single workspace of a version stored before languages, for its own language only", async () => {
        const variantOf = await build()
        const legacy = rowOf(undefined)

        expect(variantOf(legacy, "typescript")).toMatchObject({ language: "typescript" })
        expect(variantOf(legacy, "go")).toBeNull()
    })

    it("is null without any workspace", async () => {
        const variantOf = await build()
        const none = { ...rowOf(undefined), content: { ...demoContentOf(), workspace: null } }

        expect(variantOf(none, "typescript")).toBeNull()
    })
})
