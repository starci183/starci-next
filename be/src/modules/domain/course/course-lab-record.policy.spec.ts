import { labRecordFixture } from "./course-lab.testing"
import {
    COURSE_LAB_LABEL_LENGTH,
    courseIdValid,
    courseLabCheckOf,
    courseLabHashOf,
    courseLabVersionOf,
} from "./course-lab-record.policy"

const recordOf = (value: unknown = labRecordFixture()) => {
    const checked = courseLabCheckOf("saga-compensation", value)
    if (!checked.ok) throw new Error(checked.refusal)
    return checked.record
}

describe("courseLabCheckOf", () => {
    it("accepts a lab@2 record and keeps the fields the standard adds", () => {
        const record = recordOf({ ...labRecordFixture(), extra: { kept: true } })

        expect(record.lessonId).toBe("saga-compensation")
        expect(record.happy.map((each) => each.id)).toEqual(["h1", "h2"])
        expect(record.unhappy.map((each) => each.id)).toEqual(["u1", "u2", "u3"])
        expect(record.stack.services[0]?.uses).toEqual([])
        expect(record).toMatchObject({ extra: { kept: true } })
    })

    it("accepts a lab with no framework version", () => {
        const { framework: _framework, ...withoutFramework } = labRecordFixture()

        expect(recordOf(withoutFramework).framework).toBeUndefined()
    })

    it("accepts the StarCi standard reference with its variants, stack and libs, and refuses one pinned to a branch", () => {
        const reference = {
            repo: "starci-next/essential-saga",
            commit: "0123456789abcdef0123456789abcdef01234567",
            lang: "typescript",
            url: "https://github.com/starci-next/essential-saga/tree/0123456789abcdef0123456789abcdef01234567/typescript",
            checked: "2026-11-28",
            command: "starci-relay ref saga-compensation --lang typescript",
            note: { vi: "Cùng bài Saga, viết theo chuẩn StarCi.", en: "The same Saga lesson, to the StarCi standard." },
            variants: [
                { lang: "typescript", label: "TypeScript · NestJS", status: "ready", folder: "typescript" },
                { lang: "go", label: "Go", status: "soon", folder: "go" },
            ],
            stack: ["typescript", "nestjs", "postgresql"],
            libs: ["@nestjs/core", "pg"],
        }

        expect(recordOf({ ...labRecordFixture(), reference }).reference?.variants.map((each) => each.status)).toEqual(["ready", "soon"])
        expect(courseLabCheckOf("saga-compensation", { ...labRecordFixture(), reference: { ...reference, commit: "main" } })).toEqual({
            ok: false,
            refusal: "COURSE_LAB_RECORD_INVALID",
        })
    })

    it("accepts the read-through audit with its cases, and drops (never refuses the lesson for) an unknown verdict or impact, or two findings of one id", () => {
        const audit = {
            checked: "2026-11-28",
            reader: "dev backend ~1 năm, chưa làm distributed transaction",
            prerequisites: ["REST API", "transaction trong một database"],
            pages: [{ page: "intro", verdict: "vap", note: "Câu hỏi phỏng vấn đến trước khi biết hệ thống có mấy service." }],
            findings: [
                {
                    id: "intro-1",
                    page: "intro",
                    kind: "bien-tap",
                    quote: "Bạn sẽ bù trừ thế nào?",
                    why: "Chữ bù trừ xuất hiện trước khi được giải thích.",
                    fix: "Nói việc cần làm bằng lời thường trước khi gọi tên.",
                    rank: 1,
                    status: "fixed",
                },
            ],
            cases: [
                {
                    id: "u1",
                    kind: "unhappy",
                    title: "Kho hết hàng sau khi đã trừ tiền",
                    now: { situation: "Tiền đã trừ, kho báo hết.", conditions: ["Tiền được hoàn"], hints: ["Nghĩ về bước ngược lại"] },
                    expected: [
                        {
                            file: "services/orders/src/checkout.ts",
                            diff: "-  return fail()\n+  await refund(order)",
                            what: "Hoàn tiền khi kho hết, vì tiền đã trừ.",
                        },
                    ],
                    thinking: {
                        learns: "Mỗi bước đã chạy cần một bước bù.",
                        shift: "Từ rollback một database sang bù từng service.",
                        interview: "Nói được vì sao không dùng 2PC.",
                        impact: "high",
                        mechanical: false,
                    },
                    verdict: "de",
                    note: "Đọc là hiểu.",
                },
            ],
        }

        const read = recordOf({ ...labRecordFixture(), audit }).audit
        expect(read?.findings.map((each) => each.status)).toEqual(["fixed"])
        expect(read?.cases?.map((each) => each.thinking.impact)).toEqual(["high"])
        expect(recordOf(labRecordFixture()).audit).toBeUndefined()
        const malformed = [
            { ...audit, pages: [{ page: "intro", verdict: "kho", note: "x" }] },
            { ...audit, cases: [{ ...audit.cases[0], thinking: { ...audit.cases[0]?.thinking, impact: "huge" } }] },
            { ...audit, findings: [...audit.findings, ...audit.findings] },
        ]
        for (const each of malformed) {
            const check = courseLabCheckOf("saga-compensation", { ...labRecordFixture(), audit: each })
            expect(check.ok).toBe(true)
            expect(check.ok ? check.record.audit : "refused").toBeUndefined()
        }
    })

    it("keeps a case's before-and-after block, and drops a malformed one from its case alone (never refusing the lesson)", () => {
        const fixture = labRecordFixture()
        const beforeAfter = {
            before: { steps: ["**orders** gọi `POST /charges`"], result: "Tiền bị trừ", damage: "Khách mất tiền" },
            after: { steps: ["**orders** gọi `POST /refunds`"], result: "Tiền được hoàn", gain: "Khách giữ tiền" },
            fix: "Thêm bước `refund` khi giữ hàng lỗi",
            idea: "Mỗi bước có một bước đảo",
        }
        const [first, ...others] = fixture.unhappy
        const kept = recordOf({ ...fixture, unhappy: [{ ...first, beforeAfter }, ...others] })
        expect(kept.unhappy[0]?.beforeAfter).toEqual(beforeAfter)

        const broken = { ...beforeAfter, after: { steps: [], result: "x", gain: "y" } }
        const check = courseLabCheckOf("saga-compensation", {
            ...fixture,
            happy: fixture.happy.map((each) => ({ ...each, beforeAfter: { idea: 1 } })),
            unhappy: [{ ...first, beforeAfter: broken }, { ...others[0], beforeAfter }, ...others.slice(1)],
        })
        expect(check.ok).toBe(true)
        const read = check.ok ? check.record : null
        expect(read?.happy.map((each) => each.beforeAfter)).toEqual(fixture.happy.map(() => undefined))
        expect(read?.unhappy[0]?.beforeAfter).toBeUndefined()
        expect(read?.unhappy[1]?.beforeAfter).toEqual(beforeAfter)
    })

    it("refuses a key that is not the lesson id, never renaming it", () => {
        expect(courseLabCheckOf("other-lesson", labRecordFixture())).toEqual({
            ok: false,
            refusal: "COURSE_LAB_KEY_MISMATCH",
        })
    })

    it("refuses a record of another schema, with no happy case, or with a bad shape", () => {
        const refused = (value: unknown) =>
            expect(courseLabCheckOf("saga-compensation", value)).toEqual({
                ok: false,
                refusal: "COURSE_LAB_RECORD_INVALID",
            })
        refused({ ...labRecordFixture(), schema: "starci-next-seed-standard/essentials-lab@1" })
        refused({ ...labRecordFixture(), happy: [] })
        refused({ ...labRecordFixture(), learnerFile: "" })
        refused({ ...labRecordFixture(), lessonId: "Saga Compensation" })
        refused("not a record")
        refused(null)
    })

    it("refuses a case with more than three hints", () => {
        const value = labRecordFixture()
        const unhappy = value["unhappy"] as Array<Record<string, unknown>>
        unhappy[0] = { ...unhappy[0], hints: [{ vi: "1" }, { vi: "2" }, { vi: "3" }, { vi: "4" }] }

        expect(courseLabCheckOf("saga-compensation", value)).toMatchObject({ ok: false })
    })

    it("refuses duplicate case ids across the two lists and an invariant the record does not declare", () => {
        const dup = labRecordFixture()
        const happy = dup["happy"] as Array<Record<string, unknown>>
        happy[1] = { ...happy[1], id: "u1" }
        expect(courseLabCheckOf("saga-compensation", dup)).toMatchObject({ ok: false })

        const unknown = labRecordFixture()
        const unhappy = unknown["unhappy"] as Array<Record<string, unknown>>
        unhappy[2] = { ...unhappy[2], invariants: ["never-declared"] }
        expect(courseLabCheckOf("saga-compensation", unknown)).toMatchObject({ ok: false })
    })
})

describe("courseLabHashOf", () => {
    it("is the same for the same content in any key order and changes with the content", () => {
        const record = recordOf()
        const reordered = recordOf(
            Object.fromEntries(Object.entries(labRecordFixture()).reverse()) as Record<string, unknown>,
        )
        const changed = recordOf({ ...labRecordFixture(), learnerFile: "services/orders/src/other.ts" })

        expect(courseLabHashOf(record)).toMatch(/^[0-9a-f]{64}$/u)
        expect(courseLabHashOf(reordered)).toBe(courseLabHashOf(record))
        expect(courseLabHashOf(changed)).not.toBe(courseLabHashOf(record))
    })

    it("labels a version with the head of the hash", () => {
        const hash = courseLabHashOf(recordOf())

        expect(courseLabVersionOf(hash)).toBe(hash.slice(0, COURSE_LAB_LABEL_LENGTH))
    })
})

describe("courseIdValid", () => {
    it("accepts a lowercase slug only", () => {
        expect(courseIdValid("saga-compensation")).toBe(true)
        expect(courseIdValid("Saga")).toBe(false)
        expect(courseIdValid("-saga")).toBe(false)
        expect(courseIdValid("a".repeat(101))).toBe(false)
    })
})

describe("the chaos labels of a lab record", () => {
    const labels = [
        { id: "STOCK_OUT", label: { vi: "Kho hết hàng", en: "Out of stock" } },
        { id: "NET_SLOW", label: { vi: "Mạng chậm", en: "Slow network" } },
    ]

    it("are optional: a record cut before the lab declared them is still a record", () => {
        expect(recordOf().chaos).toBeUndefined()
    })

    it("are accepted and kept when the lab declares them", () => {
        expect(recordOf({ ...labRecordFixture(), chaos: labels }).chaos).toEqual(labels)
    })

    it("refuse a label with no English words, a missing id or a switch declared twice", () => {
        const refused = (chaos: unknown) =>
            expect(courseLabCheckOf("saga-compensation", { ...labRecordFixture(), chaos })).toEqual({
                ok: false,
                refusal: "COURSE_LAB_RECORD_INVALID",
            })

        refused([{ id: "STOCK_OUT", label: { vi: "Kho hết hàng" } }])
        refused([{ label: { vi: "a", en: "a" } }])
        refused([...labels, labels[0]])
    })
})
