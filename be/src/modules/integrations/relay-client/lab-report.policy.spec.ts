import { createHash } from "node:crypto"
import { SNAPSHOT_TEXT_MAX_BYTES, gradeTestsOf, labTestsOf, snapshotOf } from "./lab-report.policy"
import { REPORT_GRADE, REPORT_LAB, SEED_ORDER } from "./lab.testing"

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

    it("takes a [scenario:<id>] tag as the id of a visible test as well as a [test:<id>] tag", () => {
        const xml = `<testsuites><testcase name="[scenario:order-total] totals" time="0.1"/></testsuites>`

        expect(labTestsOf(xml)).toEqual([
            { id: "order-total", name: "totals", passed: true, durationMs: 100, message: "" },
        ])
    })
})

describe("gradeTestsOf", () => {
    it("reads each hidden id from its [scenario:<id>] tag, in the order of the ids, with the name of the id and a message only for a failure", () => {
        expect(gradeTestsOf(REPORT_GRADE, SEED_ORDER)).toEqual([
            { id: "h-pay-once", name: "h-pay-once", passed: true, durationMs: 300, message: "" },
            { id: "h-order-total", name: "h-order-total", passed: true, durationMs: 100, message: "" },
            { id: "h-stock", name: "h-stock", passed: false, durationMs: 200, message: "expected 0, got -1" },
        ])
    })

    it("fails an id that no test reported, so a grade always names every hidden id once", () => {
        const tests = gradeTestsOf(REPORT_GRADE, ["h-order-total", "h-never-ran"])

        expect(tests.map((test) => [test.id, test.passed])).toEqual([
            ["h-order-total", true],
            ["h-never-ran", false],
        ])
        expect(tests[1]?.message).not.toBe("")
        expect(tests[1]?.durationMs).toBe(0)
    })

    it("fails an id whose only test was skipped, and passes it only when every test of the id passed", () => {
        const xml = `<testsuites>
          <testcase name="[scenario:a] one"><skipped/></testcase>
          <testcase name="[scenario:b] one" time="0.1"/>
          <testcase name="[scenario:b] two" time="0.2"><failure message="boom">x</failure></testcase>
          <testcase name="[scenario:c] one" time="0.1"/>
          <testcase name="[scenario:c] two" time="0.2"/>
        </testsuites>`

        const tests = gradeTestsOf(xml, ["a", "b", "c"])

        expect(tests.map((test) => [test.id, test.passed, test.durationMs, test.message])).toEqual([
            ["a", false, 0, expect.any(String)],
            ["b", false, 300, "boom"],
            ["c", true, 300, ""],
        ])
    })

    it("does not take a [test:<id>] tag or a part of another id for a hidden scenario", () => {
        const xml = `<testsuites>
          <testcase name="[test:h-stock] visible one" time="0.1"/>
          <testcase name="[scenario:h-stock-extra] other" time="0.1"/>
        </testsuites>`

        expect(gradeTestsOf(xml, ["h-stock"]).map((test) => test.passed)).toEqual([false])
    })

    it("caps a failure message and gives a failure with no message a word", () => {
        const xml = `<testsuites>
          <testcase name="[scenario:a] x" time="0.1"><failure message="${"y".repeat(2000)}">z</failure></testcase>
          <testcase name="[scenario:b] x" time="0.1"><failure>  </failure></testcase>
        </testsuites>`

        const [a, b] = gradeTestsOf(xml, ["a", "b"])

        expect(a?.message.length).toBeGreaterThan(0)
        expect(a?.message.length).toBeLessThanOrEqual(1000)
        expect(b?.message).toBe("failed")
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
