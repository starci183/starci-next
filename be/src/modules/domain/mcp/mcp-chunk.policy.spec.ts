import { codeChunksOf, headingsOf, isSearchNoise, markdownChunksOf } from "./mcp-chunk.policy"

const FENCE = "```"
const WORDS = "word ".repeat(60).trim()

describe("markdownChunksOf", () => {
    const text = [
        "intro line",
        "",
        "# One",
        WORDS,
        "",
        "## One A",
        WORDS,
        "",
        `${FENCE}sh`,
        "# not a heading, a shell comment",
        FENCE,
        "",
        "# Two",
        WORDS,
    ].join("\n")

    it("cuts by heading, titles each chunk by its trail and keeps the 1-based line range", () => {
        const chunks = markdownChunksOf("section/1", text)
        expect(chunks.map((chunk) => [chunk.title, chunk.line, chunk.lineEnd])).toEqual([
            ["One", 1, 4],
            ["One > One A", 6, 11],
            ["Two", 13, 14],
        ])
        expect(chunks[1]?.text).toContain("# not a heading")
        expect(chunks[1]?.context).toBe("section/1 · One > One A")
    })

    it("joins a heading with no text to the section below it, keeping the longer trail", () => {
        const chunks = markdownChunksOf("s", ["# A", "## B", WORDS].join("\n"))
        expect(chunks).toHaveLength(1)
        expect(chunks[0]).toMatchObject({ title: "A > B", line: 1, lineEnd: 3 })
    })

    it("cuts a long section at blank lines into numbered pieces that each stay under the size bound", () => {
        const paragraph = "word ".repeat(180)
        const long = ["# Long", ...Array.from({ length: 12 }, () => `${paragraph}\n`)].join("\n")
        const chunks = markdownChunksOf("s", long)
        expect(chunks.length).toBeGreaterThan(2)
        expect(chunks.every((chunk) => chunk.text.length <= 3000)).toBe(true)
        expect(chunks[0]?.title).toBe(`Long (1/${chunks.length})`)
        expect(chunks.every((chunk, index) => index === 0 || chunk.line > (chunks[index - 1]?.lineEnd ?? 0))).toBe(true)
    })

    it("answers nothing for a blank text", () => {
        expect(markdownChunksOf("s", " \n\n")).toEqual([])
    })
})

describe("headingsOf", () => {
    it("lists the headings outside fenced code with their level and line", () => {
        expect(headingsOf(["# A", "text", FENCE, "# no", FENCE, "### C ###"].join("\n"))).toEqual([
            { level: 1, title: "A", line: 1 },
            { level: 3, title: "C", line: 6 },
        ])
    })
})

describe("codeChunksOf", () => {
    const body = (name: string): string =>
        `export const ${name} = (value: number): number => {\n${"    // work\n".repeat(80)}    return value\n}\n`

    it("makes a short file one chunk and a lock file none", () => {
        expect(codeChunksOf("src/a.ts", "export const a = 1\n")).toEqual([
            {
                path: "src/a.ts",
                line: 1,
                lineEnd: 1,
                title: "a.ts",
                context: "src/a.ts · a.ts",
                text: "export const a = 1",
            },
        ])
        expect(codeChunksOf("package-lock.json", "{ }")).toEqual([])
        expect(isSearchNoise("pkg/package-lock.json")).toBe(true)
        expect(isSearchNoise("package.json")).toBe(false)
    })

    it("cuts a script by file and symbol, keeping the comment above a declaration with it", () => {
        const imports = Array.from({ length: 10 }, (_, index) => `import { value${index} } from "./module-${index}"`)
        const text = [
            ...imports,
            "",
            "/** Claims due rows. */",
            body("claimDue"),
            "export function deliver(): void {",
            "    // work",
            `}${" ".repeat(400)}`,
            "",
            "export class Relay {",
            "    run(): void {}",
            "}",
            "",
            body("tail"),
        ].join("\n")
        const chunks = codeChunksOf("src/relay.ts", text)
        expect(chunks[0]?.title).toBe("header")
        const claim = chunks.find((chunk) => chunk.title?.includes("const claimDue"))
        expect(claim?.text.startsWith("/** Claims due rows. */")).toBe(true)
        expect(claim?.line).toBe(12)
        expect(chunks.every((chunk) => chunk.lineEnd !== undefined && chunk.lineEnd >= chunk.line)).toBe(true)
        expect(chunks.every((chunk) => chunk.context?.startsWith("src/relay.ts"))).toBe(true)
    })

    it("cuts a long class by member and names the pieces Class.member", () => {
        const members = Array.from(
            { length: 6 },
            (_, index) => `    method${index}(): void {\n${"        // work\n".repeat(40)}    }\n`,
        ).join("\n")
        const chunks = codeChunksOf("src/big.ts", `export class Big {\n${members}}\n`)
        expect(chunks.map((chunk) => chunk.title).some((title) => /^Big\.method\d/u.test(title ?? ""))).toBe(true)
        expect(chunks.every((chunk) => chunk.text.length <= 3000)).toBe(true)
    })

    it("cuts markdown by heading and other files in windows titled by the file", () => {
        expect(codeChunksOf("README.md", "# T\ntext\n").map((chunk) => chunk.title)).toEqual(["T"])
        const sql = Array.from(
            { length: 200 },
            (_, index) => `insert into t values (${index}, 'a fairly long value to make the file big');`,
        ).join("\n")
        const chunks = codeChunksOf("db/init.sql", sql)
        expect(chunks.length).toBeGreaterThan(1)
        expect(chunks[0]?.title).toBe(`init.sql (1/${chunks.length})`)
        expect(chunks.every((chunk) => chunk.text.length <= 3000)).toBe(true)
    })

    it("never lets one very long line exceed the size bound", () => {
        const chunks = codeChunksOf("a.json", `${"x".repeat(9000)}\n${"y ".repeat(1500)}`)
        expect(chunks.every((chunk) => chunk.text.length <= 3000)).toBe(true)
    })
})
