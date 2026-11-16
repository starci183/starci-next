import { harnessDocumentOf, harnessDocumentsOf, harnessCorpusOf } from "./mcp-harness.policy"

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
        expect(harnessDocumentOf(file("raw/harness/docs/a/vi.md", "x".repeat(200_001)))).toBeNull()
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
