import { FakeClock, fakeTransaction, mockEntityManager } from "@starci/jest-preset"
import type { FakeTransaction } from "@starci/jest-preset"
import { SeedRefusal } from "@modules/integrations/seed"
import { courseRecordFixture } from "./course-lab.testing"
import { courseRecordCheckOf, courseRecordHashOf, courseRecordVersionOf } from "./course-record.policy"
import { CourseSeedSet } from "./course-seed.set"
import {
    INSERT_COURSE_VERSION,
    PUBLISH_COURSE_VERSION,
    SELECT_COURSE_VERSION,
    SELECT_PUBLISHED_COURSE,
    SELECT_PUBLISHED_COURSE_IDS,
    SUPERSEDE_PUBLISHED_COURSE,
} from "./persistence/course.sql"

const NOW = "2026-11-25T02:00:00.000Z"
const KEY = "shop-giay"

const hashOf = (value: unknown): string => {
    const checked = courseRecordCheckOf(KEY, value)
    if (!checked.ok) throw new Error(checked.refusal)
    return courseRecordHashOf(checked.record)
}

const changed = (): Record<string, unknown> => ({ ...courseRecordFixture(), status: "published" })

const world = (query: ReadonlyArray<readonly [string, unknown]>): { set: CourseSeedSet; tx: FakeTransaction } => {
    const tx = fakeTransaction(mockEntityManager({ query }))
    return { set: new CourseSeedSet(tx.em, new FakeClock(NOW)), tx }
}

const heldRow = (value: unknown) => [
    { course_id: KEY, version: courseRecordVersionOf(hashOf(value)), content_hash: hashOf(value) },
]

describe("CourseSeedSet", () => {
    it("is the essentials-courses set", () => {
        expect(world([]).set.set).toBe("essentials-courses")
    })

    it("creates a course the standard carries and the database does not hold", async () => {
        const { set, tx } = world([
            [SELECT_PUBLISHED_COURSE, []],
            [SELECT_COURSE_VERSION, []],
            [SUPERSEDE_PUBLISHED_COURSE, []],
            [INSERT_COURSE_VERSION, [{ course_id: KEY }]],
        ])

        await expect(set.plan(KEY, courseRecordFixture())).resolves.toBe("created")
        await expect(set.apply(KEY, courseRecordFixture())).resolves.toBe("created")

        const insert = tx.committedWrites.find((write) => write.args[0] === INSERT_COURSE_VERSION)
        expect(insert?.args[1]).toEqual([
            KEY,
            courseRecordVersionOf(hashOf(courseRecordFixture())),
            hashOf(courseRecordFixture()),
            expect.stringContaining('"id":"shop-giay"'),
            expect.anything(),
        ])
    })

    it("changes nothing for a record whose hash the live version already carries", async () => {
        const { set, tx } = world([[SELECT_PUBLISHED_COURSE, heldRow(courseRecordFixture())]])

        await expect(set.plan(KEY, courseRecordFixture())).resolves.toBe("unchanged")
        await expect(set.apply(KEY, courseRecordFixture())).resolves.toBe("unchanged")
        expect(tx.committedWrites).toEqual([])
    })

    it("adds a version that supersedes the live one when the content changed", async () => {
        const { set, tx } = world([
            [SELECT_PUBLISHED_COURSE, heldRow(courseRecordFixture())],
            [SELECT_COURSE_VERSION, []],
            [SUPERSEDE_PUBLISHED_COURSE, []],
            [INSERT_COURSE_VERSION, [{ course_id: KEY }]],
        ])

        await expect(set.apply(KEY, changed())).resolves.toBe("updated")

        expect(tx.committedWrites.map((write) => write.args[0])).toEqual([
            SUPERSEDE_PUBLISHED_COURSE,
            INSERT_COURSE_VERSION,
        ])
    })

    it("makes a stored older version live again instead of inserting it twice", async () => {
        const { set, tx } = world([
            [SELECT_PUBLISHED_COURSE, heldRow(changed())],
            [SELECT_COURSE_VERSION, heldRow(courseRecordFixture())],
            [SUPERSEDE_PUBLISHED_COURSE, []],
            [PUBLISH_COURSE_VERSION, []],
        ])

        await expect(set.apply(KEY, courseRecordFixture())).resolves.toBe("updated")

        expect(tx.committedWrites.map((write) => write.args[0])).toEqual([
            SUPERSEDE_PUBLISHED_COURSE,
            PUBLISH_COURSE_VERSION,
        ])
    })

    it("refuses a version label already stored with other bytes", async () => {
        const { set, tx } = world([
            [SELECT_PUBLISHED_COURSE, heldRow(changed())],
            [
                SELECT_COURSE_VERSION,
                [
                    {
                        course_id: KEY,
                        version: courseRecordVersionOf(hashOf(courseRecordFixture())),
                        content_hash: "f".repeat(64),
                    },
                ],
            ],
        ])

        await expect(set.apply(KEY, courseRecordFixture())).rejects.toMatchObject({ code: "COURSE_VERSION_IMMUTABLE" })
        expect(tx.committedWrites).toEqual([])
    })

    it("refuses a key that is not the course id and a record that is not a course", async () => {
        const { set } = world([])

        await expect(set.plan("other", courseRecordFixture())).rejects.toBeInstanceOf(SeedRefusal)
        await expect(set.apply("other", courseRecordFixture())).rejects.toMatchObject({ code: "COURSE_KEY_MISMATCH" })
        await expect(set.apply(KEY, { id: KEY })).rejects.toMatchObject({ code: "COURSE_RECORD_INVALID" })
    })

    it("lists the courses with a live record and names the course id as the identity of a held course", async () => {
        const { set } = world([
            [SELECT_PUBLISHED_COURSE_IDS, [{ course_id: "a-course" }, { course_id: KEY }]],
            [SELECT_PUBLISHED_COURSE, heldRow(courseRecordFixture())],
        ])

        await expect(set.keys()).resolves.toEqual(["a-course", KEY])
        await expect(set.identityOf(KEY)).resolves.toBe(KEY)
    })

    it("names no identity for a course it does not hold", async () => {
        const { set } = world([[SELECT_PUBLISHED_COURSE, []]])

        await expect(set.identityOf(KEY)).resolves.toBeNull()
    })
})
