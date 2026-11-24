import { labFilesRecordFixture, labRecordFixture } from "./course-lab.testing"
import {
    chaosCommandOf,
    chaosIdOf,
    chaosOf,
    contractOf,
    cutFilesOf,
    gradingOf,
    hiddenFilesOf,
    testsOf,
} from "./course-lab-contract.policy"
import { courseLabFilesCheckOf, type CourseLabFilesMeta } from "./course-lab-files-record.policy"
import { courseLabCheckOf, type CourseLabRecord } from "./course-lab-record.policy"

const labOf = (over: Record<string, unknown> = {}): CourseLabRecord => {
    const checked = courseLabCheckOf("saga-compensation", { ...labRecordFixture(), ...over })
    if (!checked.ok) throw new Error(checked.refusal)
    return checked.record
}

const metaOf = (nestjsFiles = 1): CourseLabFilesMeta => {
    const checked = courseLabFilesCheckOf("saga-compensation", labFilesRecordFixture())
    if (!checked.ok) throw new Error(checked.refusal)
    const { base, test, grader } = checked.record
    return { base, test, grader, nestjsFiles }
}

describe("chaosIdOf", () => {
    it("writes the key in lowercase with hyphens, the only id a manifest may carry", () => {
        expect(chaosIdOf("STOCK_OUT")).toBe("stock-out")
        expect(chaosIdOf("NET_SLOW")).toBe("net-slow")
        expect(chaosIdOf("CRASH_AT")).toBe("crash-at")
    })
})

describe("chaosCommandOf", () => {
    it("sets the switch through the lab's own endpoint on every service of the stack, in one line a shell and cmd read alike", () => {
        const on = chaosCommandOf("STOCK_OUT", [4001, 4002], "on")
        const off = chaosCommandOf("STOCK_OUT", [4001, 4002], "off")

        expect(on).toContain("[4001,4002]")
        expect(on).toContain("/lab/chaos")
        expect(on).toContain("method:'PUT'")
        expect(on).toContain("JSON.stringify({STOCK_OUT:true})")
        expect(off).toContain("JSON.stringify({STOCK_OUT:false})")
        for (const command of [on, off]) {
            expect(command).toMatch(/^node -e "[^"\r\n]+"$/u)
            expect(command.length).toBeLessThanOrEqual(400)
        }
    })
})

describe("chaosOf", () => {
    it("lists each key the cases use once, in order of first use, with the stack's ports in its commands", () => {
        const chaos = chaosOf(labOf())

        expect(chaos.map((each) => each.id)).toEqual(["net-slow", "stock-out", "net-flaky"])
        expect(chaos[1]?.on).toBe(chaosCommandOf("STOCK_OUT", [4001, 4002], "on"))
        expect(chaos[1]?.off).toBe(chaosCommandOf("STOCK_OUT", [4001, 4002], "off"))
    })

    it("shows the plain key in both languages while the lab declares no label, and the lab's label once it does", () => {
        expect(chaosOf(labOf())[1]?.label).toEqual({ vi: "STOCK_OUT", en: "STOCK_OUT" })

        const labelled = chaosOf(labOf({ chaos: [{ id: "STOCK_OUT", label: { vi: "Kho hết hàng", en: "Out of stock" } }] }))

        expect(labelled[1]?.label).toEqual({ vi: "Kho hết hàng", en: "Out of stock" })
        expect(labelled[0]?.label).toEqual({ vi: "NET_SLOW", en: "NET_SLOW" })
    })

    it("leaves out a key no command can name", () => {
        const record = labOf({
            happy: [{ id: "h1", title: { vi: "a", en: "a" }, chaos: { "BAD KEY'": true, OK: true }, invariants: [] }],
        })

        expect(chaosOf(record).map((each) => each.id)).toContain("ok")
        expect(chaosOf(record).map((each) => each.id)).not.toContain("bad key'")
    })
})

describe("testsOf", () => {
    it("names every case as a visible test, happy first, by its title", () => {
        expect(testsOf(labOf()).map((each) => each.id)).toEqual(["h1", "h2", "u1", "u2", "u3"])
        expect(testsOf(labOf())[0]?.name).toEqual({ vi: "đặt hàng", en: "checkout" })
    })
})

describe("gradingOf", () => {
    it("takes the grader's command and folder, the cells as the scenarios and the matrix of the lab record", () => {
        const grading = gradingOf(labOf(), metaOf())

        expect(grading).toMatchObject({
            command: "npm run grader",
            into: "grader/",
            matrix: { steps: ["order", "payment", "stock"], faults: ["fail-before", "lost-response", "crash", "dup"] },
        })
        expect(grading?.scenarios).toHaveLength(12)
        expect(grading?.scenarios[0]).toBe("order-fail-before")
        expect(grading?.scenarios[11]).toBe("stock-dup")
    })

    it("is null when the cells do not fit the matrix", () => {
        const meta = metaOf()
        const smaller = { ...meta, grader: { ...meta.grader, cells: meta.grader.cells.slice(1) } }
        const outside = {
            ...meta,
            grader: { ...meta.grader, cells: [...meta.grader.cells.slice(1), { id: "order-boom", step: "order", fault: "boom" }] },
        }
        const renamed = {
            ...meta,
            grader: { ...meta.grader, cells: [{ id: "x", step: "order", fault: "dup" }, ...meta.grader.cells.slice(1)] },
        }

        expect(gradingOf(labOf(), smaller)).toBeNull()
        expect(gradingOf(labOf(), outside)).toBeNull()
        expect(gradingOf(labOf(), renamed)).toBeNull()
    })
})

describe("contractOf", () => {
    const contract = () => {
        const built = contractOf(labOf(), metaOf(), "starci-shop-giay-saga-compensation")
        if (built === null) throw new Error("no contract")
        return built
    }

    it("is the lab's own folder, compose file and services, under the project the relay names", () => {
        expect(contract()).toMatchObject({
            lab: "shop-giay",
            branch: "c0-naive",
            commit: null,
            dir: ".",
            compose: "docker-compose.yml",
            project: "starci-shop-giay-saga-compensation",
            services: ["orders", "payments"],
            files: ["services/orders/src/saga.ts"],
            learnerFile: "services/orders/src/saga.ts",
            frameworks: ["nestjs"],
        })
    })

    it("adapts the cases template of the standard to the relay's one-scenario template, keeping the rest of the test block", () => {
        expect(contract().test).toEqual({
            command: "npm test",
            scenario: "npm test -- --case {id}",
            report: "reports/junit.xml",
            timeoutMs: 900000,
        })
    })

    it("carries the grading, the chaos and the visible tests", () => {
        const built = contract()

        expect(built.grading?.scenarios).toHaveLength(12)
        expect(built.chaos).toHaveLength(3)
        expect(built.tests).toHaveLength(5)
    })

    it("names no framework version when the record holds no NestJS file", () => {
        expect(contractOf(labOf(), metaOf(0), "p")?.frameworks).toBeUndefined()
    })

    it("is null when the grader does not fit the matrix", () => {
        const meta = metaOf()

        expect(contractOf(labOf(), { ...meta, grader: { ...meta.grader, cells: meta.grader.cells.slice(1) } }, "p")).toBeNull()
    })
})

describe("cutFilesOf and hiddenFilesOf", () => {
    it("hands the cut as path and text and the hidden files with their hash", () => {
        const record = labFilesRecordFixture()
        const checked = courseLabFilesCheckOf("saga-compensation", record)
        if (!checked.ok) throw new Error(checked.refusal)

        expect(cutFilesOf(checked.record.source)[2]).toEqual({ path: "services/orders/src/saga.ts", text: "// c0\n" })
        expect(Object.keys(cutFilesOf(checked.record.source)[0] ?? {})).toEqual(["path", "text"])
        expect(hiddenFilesOf(checked.record.hidden)[1]).toMatchObject({
            path: "grader/matrix.test.ts",
            text: "// SECRET-GRADER\n",
            sha256: expect.stringMatching(/^[0-9a-f]{64}$/u),
        })
    })
})
