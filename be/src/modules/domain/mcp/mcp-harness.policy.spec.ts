import {
    harnessChunksOf,
    harnessCorpusOf,
    harnessDocumentOf,
    harnessDocumentsOf,
    harnessTextOf,
} from "./mcp-harness.policy"

const file = (path: string, text = "text"): { path: string; text: string } => ({ path, text })

describe("harnessDocumentOf", () => {
    it("accepts the vi and en files of a guide and a doc, in the authoring or the published layout", () => {
        expect(harnessDocumentOf(file("raw/harness/guides/claude/hooks/vi.md"))).toMatchObject({
            path: "guides/claude/hooks",
            locale: "vi",
        })
        expect(harnessDocumentOf(file("harness/guides/codex/config-toml/en.md"))).toMatchObject({
            path: "guides/codex/config-toml",
            locale: "en",
        })
        expect(harnessDocumentOf(file("raw/harness/docs/overview/en.md"))).toMatchObject({
            path: "docs/overview",
            locale: "en",
        })
    })

    it("refuses every other part of the harness and every denied or odd path", () => {
        for (const path of [
            "raw/harness/build/agent-cli/vi.md",
            "raw/harness/build/agent-cli/hidden/vi.md",
            "raw/harness/build/agent-cli/source/README.md",
            "raw/harness/trials/trap/repo/vi.md",
            "raw/harness/doctor/claude/probe.yaml",
            "raw/harness/guides/claude/hooks/stages.yaml",
            "raw/harness/guides/claude/hooks/answers/vi.md",
            "raw/harness/guides/claude/hidden/vi.md",
            "raw/harness/guides/claude/hooks/vi.md/../../../../secrets/vi.md",
            "raw/essentials/lesson/vi.md",
            "../harness/docs/overview/vi.md",
            "raw/harness/docs/Overview/vi.md",
        ])
            expect(harnessDocumentOf(file(path))).toBeNull()
    })

    it("refuses a binary or an oversized file", () => {
        expect(harnessDocumentOf(file("raw/harness/docs/a/vi.md", "a\u0000b"))).toBeNull()
        expect(harnessDocumentOf(file("raw/harness/docs/a/vi.md", "x".repeat(1_000_001)))).toBeNull()
    })
})

describe("harnessDocumentsOf", () => {
    it("keeps the first of a path and locale and sorts by path", () => {
        const documents = harnessDocumentsOf([
            file("raw/harness/docs/b/vi.md", "raw b"),
            file("harness/docs/b/vi.md", "published b"),
            file("raw/harness/docs/a/vi.md", "a"),
            file("raw/harness/build/x/vi.md", "never"),
        ])
        expect(documents.map((document) => `${document.path}:${document.text}`)).toEqual(["docs/a:a", "docs/b:raw b"])
    })
})

describe("harnessCorpusOf", () => {
    it("is one free, whole-scope corpus per locale", () => {
        expect(harnessCorpusOf("vi")).toEqual({
            scope: { kind: "harness", sourceId: "harness", locale: "vi" },
            access: "free",
            readable: ["free"],
        })
        expect(harnessCorpusOf("en").scope.locale).toBe("en")
    })
})

describe("harnessTextOf", () => {
    const MARK = "<!-- @starci/seperator -->"
    const field = (name: string, value: string): string => `# ${name}\n${MARK}\n${value}\n${MARK}\n`

    it("reads a separator-field file as its title, description and body and drops the metadata", () => {
        const raw = [
            field("sortIndex", "5"),
            field("title", "Hooks"),
            field("description", "Run a script before a tool"),
            field("sources", "README.md"),
            field("status", "draft"),
            field("body", "## Why\n\ntext of the guide\n\n# not a field"),
        ].join("")
        expect(harnessTextOf(raw)).toBe(
            "# Hooks\n\nRun a script before a tool\n\n## Why\n\ntext of the guide\n\n# not a field",
        )
    })

    it("leaves a plain file, and a separator file with no body, as they are", () => {
        expect(harnessTextOf("plain text")).toBe("plain text")
        const noBody = field("title", "T")
        expect(harnessTextOf(noBody)).toBe(noBody)
    })

    it("cuts a document by heading and locates each chunk by its path", () => {
        const text = `# A\n\n${"word ".repeat(80)}\n\n## B\n\n${"more ".repeat(80)}`
        const chunks = harnessChunksOf({ path: "docs/a", locale: "vi", text })
        expect(chunks.map((chunk) => chunk.title)).toEqual(["A", "A > B"])
        expect(chunks[1]?.context).toBe("harness/docs/a · A > B")
    })
})
