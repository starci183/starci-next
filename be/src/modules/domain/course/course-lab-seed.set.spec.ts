import { FakeClock, fakeTransaction, mockEntityManager } from "@starci/jest-preset"
import type { FakeTransaction } from "@starci/jest-preset"
import { SeedRefusal } from "@modules/integrations/seed"
import { labRecordFixture } from "./course-lab.testing"
import { courseLabCheckOf, courseLabHashOf, courseLabVersionOf } from "./course-lab-record.policy"
import { CourseLabSeedSet } from "./course-lab-seed.set"
import {
    INSERT_LAB_VERSION,
    PUBLISH_LAB_VERSION,
    SELECT_LAB_VERSION,
    SELECT_PUBLISHED_LAB,
    SELECT_PUBLISHED_LAB_IDS,
    SUPERSEDE_PUBLISHED_LAB,
} from "./persistence/course.sql"

const NOW = "2026-11-25T02:00:00.000Z"
const KEY = "saga-compensation"

const hashOf = (value: unknown): string => {
    const checked = courseLabCheckOf(KEY, value)
    if (!checked.ok) throw new Error(checked.refusal)
    return courseLabHashOf(checked.record)
}

const changed = (): Record<string, unknown> => ({ ...labRecordFixture(), learnerFile: "services/orders/src/other.ts" })

const world = (query: ReadonlyArray<readonly [string, unknown]>): { set: CourseLabSeedSet; tx: FakeTransaction } => {
    const tx = fakeTransaction(mockEntityManager({ query }))
    return { set: new CourseLabSeedSet(tx.em, new FakeClock(NOW)), tx }
}

const liveRow = (value: unknown) => [{ version: courseLabVersionOf(hashOf(value)), content_hash: hashOf(value) }]

describe("CourseLabSeedSet", () => {
    it("is the essentials-labs set", () => {
        expect(world([]).set.set).toBe("essentials-labs")
    })

    it("creates a lab the standard carries and the database does not hold", async () => {
        const { set, tx } = world([
            [SELECT_PUBLISHED_LAB, []],
            [SELECT_LAB_VERSION, []],
            [SUPERSEDE_PUBLISHED_LAB, []],
            [INSERT_LAB_VERSION, [{ lesson_id: KEY }]],
        ])

        await expect(set.plan(KEY, labRecordFixture())).resolves.toBe("created")
        await expect(set.apply(KEY, labRecordFixture())).resolves.toBe("created")

        const insert = tx.committedWrites.find((write) => write.args[0] === INSERT_LAB_VERSION)
        expect(insert?.args[1]).toEqual([
            KEY,
            courseLabVersionOf(hashOf(labRecordFixture())),
            hashOf(labRecordFixture()),
            expect.stringContaining('"lessonId":"saga-compensation"'),
            expect.anything(),
        ])
    })

    it("changes nothing for a record whose hash the live version already carries", async () => {
        const { set, tx } = world([[SELECT_PUBLISHED_LAB, liveRow(labRecordFixture())]])

        await expect(set.apply(KEY, labRecordFixture())).resolves.toBe("unchanged")
        expect(tx.committedWrites).toEqual([])
    })

    it("adds a version that supersedes the live one when the content changed", async () => {
        const { set, tx } = world([
            [SELECT_PUBLISHED_LAB, liveRow(labRecordFixture())],
            [SELECT_LAB_VERSION, []],
            [SUPERSEDE_PUBLISHED_LAB, []],
            [INSERT_LAB_VERSION, [{ lesson_id: KEY }]],
        ])

        await expect(set.apply(KEY, changed())).resolves.toBe("updated")

        expect(tx.committedWrites.map((write) => write.args[0])).toEqual([SUPERSEDE_PUBLISHED_LAB, INSERT_LAB_VERSION])
    })

    it("makes a stored older version live again instead of inserting it twice", async () => {
        const { set, tx } = world([
            [SELECT_PUBLISHED_LAB, liveRow(changed())],
            [SELECT_LAB_VERSION, liveRow(labRecordFixture())],
            [SUPERSEDE_PUBLISHED_LAB, []],
            [PUBLISH_LAB_VERSION, []],
        ])

        await expect(set.apply(KEY, labRecordFixture())).resolves.toBe("updated")

        expect(tx.committedWrites.map((write) => write.args[0])).toEqual([SUPERSEDE_PUBLISHED_LAB, PUBLISH_LAB_VERSION])
    })

    it("refuses a version label already stored with other bytes", async () => {
        const { set, tx } = world([
            [SELECT_PUBLISHED_LAB, liveRow(changed())],
            [SELECT_LAB_VERSION, [{ version: courseLabVersionOf(hashOf(labRecordFixture())), content_hash: "f".repeat(64) }]],
        ])

        await expect(set.apply(KEY, labRecordFixture())).rejects.toMatchObject({ code: "COURSE_LAB_VERSION_IMMUTABLE" })
        expect(tx.committedWrites).toEqual([])
    })

    it("refuses a key that is not the lesson id and a record that is not lab@2", async () => {
        const { set } = world([])

        await expect(set.plan("other", labRecordFixture())).rejects.toBeInstanceOf(SeedRefusal)
        await expect(set.apply("other", labRecordFixture())).rejects.toMatchObject({ code: "COURSE_LAB_KEY_MISMATCH" })
        await expect(set.apply(KEY, { lessonId: KEY })).rejects.toMatchObject({ code: "COURSE_LAB_RECORD_INVALID" })
    })

    it("lists the lessons with a live lab and names the lesson id as the identity of a held lab", async () => {
        const { set } = world([
            [SELECT_PUBLISHED_LAB_IDS, [{ lesson_id: "a-lab" }, { lesson_id: KEY }]],
            [SELECT_PUBLISHED_LAB, liveRow(labRecordFixture())],
        ])

        await expect(set.keys()).resolves.toEqual(["a-lab", KEY])
        await expect(set.identityOf(KEY)).resolves.toBe(KEY)
    })

    it("names no identity for a lab it does not hold", async () => {
        const { set } = world([[SELECT_PUBLISHED_LAB, []]])

        await expect(set.identityOf(KEY)).resolves.toBeNull()
    })
})
