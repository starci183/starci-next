import { createHash } from "node:crypto"
import { lessonViewOf } from "./course-case.policy"
import { courseLabCheckOf, type CourseLabRecord } from "./course-lab-record.policy"
import { labRecordFixture, labRecordWithRungsFixture as withRungs } from "./course-lab.testing"
import { diffDecisionOf, rungFileOf, rungOfSpan, rungSpanOf, type CourseRungSpan } from "./course-rung.policy"

const recordOf = (value: Record<string, unknown>): CourseLabRecord => {
    const checked = courseLabCheckOf("saga-compensation", value)
    if (!checked.ok) throw new Error(checked.refusal)
    return checked.record
}

const spanOf = (record: CourseLabRecord, caseId: string): CourseRungSpan => {
    const read = rungSpanOf(record, caseId)
    if (read.kind !== "span") throw new Error(read.kind)
    return read.span
}

describe("course rung record check", () => {
    it("accepts a record whose cases' refs are rungs past the base", () => {
        expect(courseLabCheckOf("saga-compensation", withRungs()).ok).toBe(true)
    })

    it("refuses a ref missing from the rungs, a ref that is the base, and a tag written twice", () => {
        const record = withRungs()
        const unhappy = record.unhappy as Array<Record<string, unknown>>
        for (const bad of [
            { unhappy: [{ ...unhappy[0], ref: "c9-nowhere" }, unhappy[1], unhappy[2]] },
            { unhappy: [{ ...unhappy[0], ref: "c0-naive" }, unhappy[1], unhappy[2]] },
            { rungs: [...(record.rungs as Array<unknown>), { tag: "c1-compensate", content: "" }] },
        ])
            expect(courseLabCheckOf("saga-compensation", { ...record, ...bad })).toEqual({
                ok: false,
                refusal: "COURSE_LAB_RECORD_INVALID",
            })
    })

    it("still accepts a record cut before the rungs", () => {
        expect(courseLabCheckOf("saga-compensation", labRecordFixture()).ok).toBe(true)
    })
})

describe("rungSpanOf", () => {
    it("spans the base and the first fix for the first unhappy case, then each fix and the one before it", () => {
        const record = recordOf(withRungs())
        expect(spanOf(record, "u1")).toEqual({
            previous: { tag: "c0-naive", content: "// c0\n" },
            reference: { tag: "c1-compensate", content: "// c1\n" },
        })
        expect(spanOf(record, "u2").previous.tag).toBe("c1-compensate")
        expect(spanOf(record, "u2").reference.tag).toBe("c2-retry")
    })

    it("has no rung for a happy case, a case without a reference step, or a record without rungs; no case for an unknown id", () => {
        const record = recordOf(withRungs())
        expect(rungSpanOf(record, "h1")).toEqual({ kind: "no-rung" })
        expect(rungSpanOf(record, "u3")).toEqual({ kind: "no-rung" })
        expect(rungSpanOf(recordOf(labRecordFixture()), "u1")).toEqual({ kind: "no-rung" })
        expect(rungSpanOf(record, "nope")).toEqual({ kind: "no-case" })
    })
})

describe("diffDecisionOf", () => {
    const span = spanOf(recordOf(withRungs()), "u2")

    it("serves the case's own two rungs once the case is recorded green", () => {
        expect(diffDecisionOf(span, "c1-compensate", true)).toBe("serve")
        expect(diffDecisionOf(span, "c2-retry", true)).toBe("serve")
    })

    it("locks them before the server holds the green mark", () => {
        expect(diffDecisionOf(span, "c2-retry", false)).toBe("locked")
        expect(diffDecisionOf(span, "c1-compensate", false)).toBe("locked")
    })

    it("never serves another rung under the case's name, green or not", () => {
        const first = spanOf(recordOf(withRungs()), "u1")
        expect(diffDecisionOf(first, "c2-retry", true)).toBe("not-found")
        expect(diffDecisionOf(span, "c0-naive", true)).toBe("not-found")
    })
})

describe("rungFileOf", () => {
    it("serves one file named rung:<tag> at the learner file's path with the hash of its bytes", () => {
        const record = recordOf(withRungs())
        const span = spanOf(record, "u1")
        expect(rungFileOf(record, rungOfSpan(span, "c1-compensate"))).toEqual({
            kind: "rung:c1-compensate",
            tag: "c1-compensate",
            path: "services/orders/src/checkout.ts",
            content: "// c1\n",
            sha256: createHash("sha256").update("// c1\n", "utf8").digest("hex"),
        })
        expect(rungOfSpan(span, "c0-naive").tag).toBe("c0-naive")
    })
})

describe("the web view of a lab with rungs", () => {
    it("never carries a rung's text or a case's ref", () => {
        const text = JSON.stringify(lessonViewOf(recordOf(withRungs()), "v1", [], "vi"))
        for (const secret of ["// c1", "// c2", "c1-compensate", "c2-retry", "c0-naive"])
            expect(text).not.toContain(secret)
    })
})
