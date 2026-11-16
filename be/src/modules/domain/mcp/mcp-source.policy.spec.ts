import { catalogOf, fileOf, readablePathOf } from "./mcp-source.policy"

describe("readablePathOf", () => {
    it.each(["src/ledger.ts", "./src/./ledger.ts", "docker-compose.yml", "README.md"])("opens %s", (path) => {
        expect(readablePathOf(path, [])).not.toBeNull()
    })

    it.each([
        "../outside.txt",
        "src/../../outside.txt",
        "/etc/passwd",
        "C:/Windows/win.ini",
        `src${String.fromCharCode(92)}ledger.ts`,
        "src/ledger.ts\u0000.png",
        "",
        ".git/config",
        ".env",
        ".env.production",
        "hidden/transfer.test.ts",
        "tests/Hidden/x.ts",
        "submissions/0/solution.ts",
        "mutants/m1.ts",
        "rubric.json",
        "rubrics/transfer.md",
        "src/answers.ts",
        "src/answer-key.ts",
        "src/transfer.hidden.test.ts",
        "src/solution.ts",
        "keys/server.pem",
        "starci-source.json",
        "expected-evidence/c2.md",
    ])("refuses %s", (path) => {
        expect(readablePathOf(path, [])).toBeNull()
    })

    it("refuses the prefixes the teacher denied, whatever their case", () => {
        expect(readablePathOf("Teacher-Only/notes.md", ["teacher-only"])).toBeNull()
        expect(readablePathOf("teacher-only", ["teacher-only/"])).toBeNull()
        expect(readablePathOf("teacher-onlyx/notes.md", ["teacher-only"])).not.toBeNull()
    })
})

describe("catalogOf", () => {
    const raw = {
        commit: "abc1234",
        scenarios: [
            {
                id: "double-spend",
                title: "Double spend",
                fault: "retry applies twice",
                invariant: "C2",
                guards: ["idempotency"],
                expected: "SECRET-EXPECTED",
            },
            { id: "insane-1", title: "Insane", fault: "x", hidden: true },
            { id: "Bad Id", title: "Bad", fault: "x" },
        ],
        invariants: [
            {
                id: "C2",
                name: "Once",
                statement: "A transfer applies once",
                where: "src/ledger.ts:42",
                revealedBy: "double-spend",
                answer: "SECRET-ANSWER",
            },
        ],
        deny: ["teacher-only/"],
    }

    it("keeps only the public fields of the visible scenarios", () => {
        const catalog = catalogOf("bank-transfer", raw)
        expect(catalog?.scenarios.map((scenario) => scenario.id)).toEqual(["double-spend"])
        expect(catalog?.scenarios[0]?.command).toBe(
            "starci-next run bank-transfer --scenario double-spend [--guard idempotency=off]",
        )
        expect(JSON.stringify(catalog)).not.toContain("SECRET")
        expect(JSON.stringify(catalog)).not.toContain("insane-1")
        expect(catalog?.deny).toEqual(["teacher-only"])
    })

    it("is null for a file that is not a catalog", () => {
        expect(catalogOf("x", null)).toBeNull()
        expect(catalogOf("x", { commit: "not a sha" })).toBeNull()
    })
})

describe("fileOf", () => {
    const text = Array.from({ length: 1000 }, (_, index) => `line ${index + 1}`).join("\n")

    it("clamps a range to 400 lines and the file", () => {
        expect(fileOf("a.ts", "abc1234", text, 10, 5000)).toMatchObject({ from: 10, to: 409, total: 1000 })
        expect(fileOf("a.ts", "abc1234", text, 990, 1100)).toMatchObject({ from: 990, to: 1000 })
        expect(fileOf("a.ts", "abc1234", text).to).toBe(400)
    })
})
