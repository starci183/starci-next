import { labFileFixture, labFilesRecordFixture } from "./course-lab.testing"
import {
    courseLabFileListOf,
    courseLabFilesCheckOf,
    courseLabFilesHashOf,
    courseLabFilesMetaOf,
} from "./course-lab-files-record.policy"
import { courseLabVersionOf } from "./course-lab-record.policy"

const KEY = "saga-compensation"

const recordOf = (value: unknown = labFilesRecordFixture()) => {
    const checked = courseLabFilesCheckOf(KEY, value)
    if (!checked.ok) throw new Error(checked.refusal)
    return checked.record
}

const invalid = (value: unknown) =>
    expect(courseLabFilesCheckOf(KEY, value)).toEqual({ ok: false, refusal: "COURSE_LAB_FILES_RECORD_INVALID" })

describe("courseLabFilesCheckOf", () => {
    it("accepts the record of the standard and keeps the fields it adds", () => {
        const record = recordOf({ ...labFilesRecordFixture(), extra: { kept: true } })

        expect(record.base).toBe("c0-naive")
        expect(record.source.map((file) => file.path)).toEqual([
            "docker-compose.yml",
            "package.json",
            "services/orders/src/checkout.ts",
        ])
        expect(record.hidden.map((file) => file.path)).toEqual(["grader/jest.config.js", "grader/matrix.test.ts"])
        expect(record.grader.cells).toHaveLength(12)
        expect(record).toMatchObject({ extra: { kept: true } })
    })

    it("refuses a key that is not the lesson id, never renaming it", () => {
        expect(courseLabFilesCheckOf("other-lesson", labFilesRecordFixture())).toEqual({
            ok: false,
            refusal: "COURSE_LAB_FILES_KEY_MISMATCH",
        })
    })

    it("refuses a record that is not a lab files record", () => {
        invalid({ lessonId: KEY })
        invalid({ ...labFilesRecordFixture(), source: [] })
        invalid({
            ...labFilesRecordFixture(),
            test: { command: "npm test", cases: "npm test", report: "r.xml", timeoutMs: 1000 },
        })
        invalid({ ...labFilesRecordFixture(), schema: "other@1" })
    })

    it("refuses a file whose hash is not the hash of its text", () => {
        const record = labFilesRecordFixture()
        const source = record.source as Array<Record<string, unknown>>

        invalid({ ...record, source: [{ ...source[0], text: "tampered" }, ...source.slice(1)] })
    })

    it("refuses an unsafe or repeated path", () => {
        const record = labFilesRecordFixture()
        const source = record.source as Array<unknown>

        for (const path of ["/etc/passwd", "../x", "a/../x", "a//b", "a\\b", ".git/config", "a/./b", ""])
            invalid({ ...record, source: [labFileFixture(path, "x")] })
        invalid({ ...record, source: [...source, labFileFixture("package.json", "other")] })
    })

    it("refuses a hidden file outside the grader folder, and a grader or hidden file inside a learner cut", () => {
        const record = labFilesRecordFixture()
        const source = record.source as Array<unknown>

        invalid({ ...record, hidden: [labFileFixture("src/matrix.test.ts", "x")] })
        invalid({ ...record, hidden: [labFileFixture("grader", "x")] })
        invalid({ ...record, source: [...source, labFileFixture("grader/matrix.test.ts", "// SECRET-GRADER\n")] })
        invalid({ ...record, source: [...source, labFileFixture("hidden/answers.txt", "x")] })
        invalid({ ...record, framework: { nestjs: [labFileFixture("grader/steps.ts", "x")] } })
    })

    it("refuses a repeated cell id", () => {
        const record = labFilesRecordFixture()
        const grader = record.grader as { cells: Array<Record<string, string>> }

        invalid({ ...record, grader: { ...grader, cells: [...grader.cells, { ...grader.cells[0] }] } })
    })
})

describe("courseLabFilesHashOf", () => {
    it("is the hash of the content, whatever the order of the keys, and a changed record changes it", () => {
        const record = labFilesRecordFixture()
        const reordered = Object.fromEntries(Object.entries(record).reverse())
        const other = { ...record, base: "c1-other" }

        expect(courseLabFilesHashOf(recordOf(reordered))).toBe(courseLabFilesHashOf(recordOf()))
        expect(courseLabFilesHashOf(recordOf(other))).not.toBe(courseLabFilesHashOf(recordOf()))
        expect(courseLabVersionOf(courseLabFilesHashOf(recordOf()))).toMatch(/^[0-9a-f]{12}$/u)
    })
})

describe("the stored slices", () => {
    it("reads a list of files and refuses one that is not sound", () => {
        expect(courseLabFileListOf([labFileFixture("a.ts", "x")])).toEqual([labFileFixture("a.ts", "x")])
        expect(courseLabFileListOf([{ path: "a.ts", sha256: "0".repeat(64), text: "x" }])).toBeNull()
        expect(courseLabFileListOf([labFileFixture("a.ts", "x"), labFileFixture("a.ts", "x")])).toBeNull()
        expect(courseLabFileListOf(null)).toBeNull()
    })

    it("reads the base, test and grader with the NestJS file count, and nothing else", () => {
        const record = labFilesRecordFixture()
        const meta = courseLabFilesMetaOf({ base: record.base, test: record.test, grader: record.grader, nestjsFiles: 1 })

        expect(meta?.base).toBe("c0-naive")
        expect(meta?.nestjsFiles).toBe(1)
        expect(courseLabFilesMetaOf({ base: "c0" })).toBeNull()
    })
})
