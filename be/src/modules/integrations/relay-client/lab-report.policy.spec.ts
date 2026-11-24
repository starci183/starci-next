import { createHash } from "node:crypto"
import { SNAPSHOT_TEXT_MAX_BYTES, labTestsOf, snapshotOf } from "./lab-report.policy"
import { REPORT_LAB } from "./lab.testing"

describe("labTestsOf", () => {
    it("maps a JUnit report to tests: the tag or the name slug is the id, a skipped test is left out", () => {
        expect(labTestsOf(REPORT_LAB)).toEqual([
            { id: "orders-once", name: "places an order once", passed: true, durationMs: 250, message: "" },
            {
                id: "stock-never-goes-negative",
                name: "stock never goes negative",
                passed: false,
                durationMs: 500,
                message: "stock was -1",
            },
        ])
    })

    it("numbers a repeated id, caps a message at 1000 characters and never invents a message for a pass", () => {
        const long = "x".repeat(2000)
        const xml = `<testsuites>
          <testcase name="same name" time="0.1"/>
          <testcase name="Same name!" time="0.1"><failure message="${long}">y</failure></testcase>
        </testsuites>`

        const tests = labTestsOf(xml)

        expect(tests.map((test) => test.id)).toEqual(["same-name", "same-name-2"])
        expect(tests[0]?.message).toBe("")
        expect(tests[1]?.message.length).toBeLessThanOrEqual(1000)
    })

    it("reads nothing from a report without test cases", () => {
        expect(labTestsOf("<testsuites/>")).toEqual([])
    })
})

describe("snapshotOf", () => {
    const files: Record<string, Buffer> = {
        "src/a.ts": Buffer.from("export const a = 1\n"),
        "src/big.ts": Buffer.alloc(SNAPSHOT_TEXT_MAX_BYTES + 1, 97),
        "src/bin.dat": Buffer.from([0, 1, 2, 255]),
        "src/other.ts": Buffer.from("not in the list"),
    }
    const read = (path: string): Buffer | null => files[path] ?? null
    const allowed = ["src/a.ts", "src/big.ts", "src/bin.dat", "src/missing.ts"]

    it("carries the text and the sha256 of a small text file", () => {
        const [file] = snapshotOf(["src/a.ts"], allowed, read)

        expect(file).toEqual({
            path: "src/a.ts",
            sha256: createHash("sha256")
                .update(files["src/a.ts"] as Buffer)
                .digest("hex"),
            text: "export const a = 1\n",
        })
    })

    it("keeps the hash alone for a file over 64 KiB and for a file that is not text", () => {
        const snapshot = snapshotOf(["src/big.ts", "src/bin.dat"], allowed, read)

        expect(snapshot.map((file) => file.text)).toEqual([null, null])
        expect(snapshot[0]?.sha256).toBe(
            createHash("sha256")
                .update(files["src/big.ts"] as Buffer)
                .digest("hex"),
        )
    })

    it("takes exactly the text of a file at the cap", () => {
        const edge = Buffer.alloc(SNAPSHOT_TEXT_MAX_BYTES, 98)

        expect(snapshotOf(["src/a.ts"], ["src/a.ts"], () => edge)[0]?.text).toHaveLength(SNAPSHOT_TEXT_MAX_BYTES)
    })

    it("leaves out a path that is not in the lab's files, an unsafe path, a duplicate and a file that is missing", () => {
        const snapshot = snapshotOf(
            ["src/other.ts", "../etc/passwd", ".git/config", "src/a.ts", "src/a.ts", "src/missing.ts"],
            [...allowed, "../etc/passwd", ".git/config"],
            read,
        )

        expect(snapshot.map((file) => file.path)).toEqual(["src/a.ts"])
    })
})
