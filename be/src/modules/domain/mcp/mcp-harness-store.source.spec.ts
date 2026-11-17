import type { HarnessPageView, HarnessReadService } from "@modules/domain/harness"
import { harnessDocumentsOf } from "./mcp-harness.policy"
import { McpHarnessStoreSource } from "./mcp-harness-store.source"

const section = (title: string, body: string, run: ReadonlyArray<string> = []) => ({
    id: title,
    order: 1,
    title,
    body,
    run,
})

describe("McpHarnessStoreSource", () => {
    const pages: Array<HarnessPageView> = [
        {
            kind: "guide",
            tool: "claude",
            slug: "hooks",
            title: "Hooks",
            summary: "Run a script",
            sections: [section("Why", "text", ["claude doctor"])],
        },
        {
            kind: "doc",
            tool: null,
            slug: "overview",
            title: "Overview",
            summary: "",
            sections: [section("What", "words")],
        },
    ]
    const source = new McpHarnessStoreSource({
        pages: (locale: string) => Promise.resolve(locale === "vi" ? pages : []),
    } as unknown as HarnessReadService)

    it("writes each stored guide and doc as the markdown file the index policy accepts, with its copy-run block", async () => {
        const files = await source.files()
        expect(files.map((file) => file.path)).toEqual([
            "harness/guides/claude/hooks/vi.md",
            "harness/docs/overview/vi.md",
        ])
        expect(files[0]?.text).toBe("# Hooks\n\nRun a script\n\n## Why\n\ntext\n\n```sh\nclaude doctor\n```")
        expect(harnessDocumentsOf(files).map((document) => [document.path, document.locale])).toEqual([
            ["docs/overview", "vi"],
            ["guides/claude/hooks", "vi"],
        ])
    })
})
