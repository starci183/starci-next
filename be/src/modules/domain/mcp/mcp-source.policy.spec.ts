import type { LessonSourceTree } from "@modules/domain/lesson"
import { catalogOf, fileOf, readablePathOf } from "./mcp-source.policy"

describe("readablePathOf", () => {
    it.each(["src/ledger.ts", "./src/./ledger.ts", "docker-compose.yml", "README.md"])("opens %s", (path) => {
        expect(readablePathOf(path)).not.toBeNull()
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
        expect(readablePathOf(path)).toBeNull()
    })
})

describe("catalogOf", () => {
    const tree: LessonSourceTree = {
        commit: "abc1234def5678abc1234def5678abc1234def56",
        files: [],
        scenarios: [
            {
                id: "double-spend",
                title: "Double spend",
                fault: "retry applies twice",
                invariant: "C2",
                guards: ["idempotency"],
            },
        ],
        invariants: [
            { id: "C1", text: "Money is conserved", where: null },
            { id: "C2", text: "A transfer applies once", where: "src/ledger.ts:42" },
            { id: "C3", text: "Writers serialise", where: "hidden/c3.test.ts:1" },
        ],
    }

    it("builds the commands, reveals each invariant by its scenario and drops a location that is not readable", () => {
        const catalog = catalogOf("bank-transfer", tree)
        expect(catalog.commit).toBe(tree.commit)
        expect(catalog.scenarios[0]?.command).toBe(
            "starci-next run bank-transfer --scenario double-spend [--guard idempotency=off]",
        )
        expect(catalog.invariants.map((invariant) => [invariant.id, invariant.revealedBy, invariant.where])).toEqual([
            ["C1", null, null],
            ["C2", "double-spend", "src/ledger.ts:42"],
            ["C3", null, null],
        ])
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
