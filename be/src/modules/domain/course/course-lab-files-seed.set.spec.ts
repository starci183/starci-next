import { FakeClock, fakeTransaction, mockEntityManager } from "@starci/jest-preset"
import type { FakeTransaction } from "@starci/jest-preset"
import { SeedRefusal } from "@modules/integrations/seed"
import { labFileFixture, labFilesRecordFixture } from "./course-lab.testing"
import { courseLabFilesCheckOf, courseLabFilesHashOf } from "./course-lab-files-record.policy"
import { CourseLabFilesSeedSet } from "./course-lab-files-seed.set"
import { courseLabVersionOf } from "./course-lab-record.policy"
import {
    INSERT_LAB_FILES_VERSION,
    PUBLISH_LAB_FILES_VERSION,
    SELECT_LAB_FILES_VERSION,
    SELECT_PUBLISHED_LAB_FILES,
    SELECT_PUBLISHED_LAB_FILES_IDS,
    SUPERSEDE_PUBLISHED_LAB_FILES,
} from "./persistence/course.sql"

const NOW = "2026-11-25T02:00:00.000Z"
const KEY = "saga-compensation"

const hashOf = (value: unknown): string => {
    const checked = courseLabFilesCheckOf(KEY, value)
    if (!checked.ok) throw new Error(checked.refusal)
    return courseLabFilesHashOf(checked.record)
}

const changed = (): Record<string, unknown> => ({
    ...labFilesRecordFixture(),
    source: [labFileFixture("services/orders/src/saga.ts", "// c0, changed\n")],
})

const world = (
    query: ReadonlyArray<readonly [string, unknown]>,
): { set: CourseLabFilesSeedSet; tx: FakeTransaction } => {
    const tx = fakeTransaction(mockEntityManager({ query }))
    return { set: new CourseLabFilesSeedSet(tx.em, new FakeClock(NOW)), tx }
}

const liveRow = (value: unknown) => [{ version: courseLabVersionOf(hashOf(value)), content_hash: hashOf(value) }]

describe("CourseLabFilesSeedSet", () => {
    it("is the essentials-lab-files set", () => {
        expect(world([]).set.set).toBe("essentials-lab-files")
    })

    it("creates the files the standard carries and the database does not hold", async () => {
        const { set, tx } = world([
            [SELECT_PUBLISHED_LAB_FILES, []],
            [SELECT_LAB_FILES_VERSION, []],
            [SUPERSEDE_PUBLISHED_LAB_FILES, []],
            [INSERT_LAB_FILES_VERSION, [{ lesson_id: KEY }]],
        ])

        await expect(set.plan(KEY, labFilesRecordFixture())).resolves.toBe("created")
        await expect(set.apply(KEY, labFilesRecordFixture())).resolves.toBe("created")

        const insert = tx.committedWrites.find((write) => write.args[0] === INSERT_LAB_FILES_VERSION)
        expect(insert?.args[1]).toEqual([
            KEY,
            courseLabVersionOf(hashOf(labFilesRecordFixture())),
            hashOf(labFilesRecordFixture()),
            expect.stringContaining("SECRET-GRADER"),
            expect.anything(),
        ])
    })

    it("changes nothing for a record whose hash the live version already carries", async () => {
        const { set, tx } = world([[SELECT_PUBLISHED_LAB_FILES, liveRow(labFilesRecordFixture())]])

        await expect(set.apply(KEY, labFilesRecordFixture())).resolves.toBe("unchanged")
        expect(tx.committedWrites).toEqual([])
    })

    it("adds a version that supersedes the live one when the content changed", async () => {
        const { set, tx } = world([
            [SELECT_PUBLISHED_LAB_FILES, liveRow(labFilesRecordFixture())],
            [SELECT_LAB_FILES_VERSION, []],
            [SUPERSEDE_PUBLISHED_LAB_FILES, []],
            [INSERT_LAB_FILES_VERSION, [{ lesson_id: KEY }]],
        ])

        await expect(set.apply(KEY, changed())).resolves.toBe("updated")

        expect(tx.committedWrites.map((write) => write.args[0])).toEqual([
            SUPERSEDE_PUBLISHED_LAB_FILES,
            INSERT_LAB_FILES_VERSION,
        ])
    })

    it("makes a stored older version live again instead of inserting it twice", async () => {
        const { set, tx } = world([
            [SELECT_PUBLISHED_LAB_FILES, liveRow(changed())],
            [SELECT_LAB_FILES_VERSION, liveRow(labFilesRecordFixture())],
            [SUPERSEDE_PUBLISHED_LAB_FILES, []],
            [PUBLISH_LAB_FILES_VERSION, []],
        ])

        await expect(set.apply(KEY, labFilesRecordFixture())).resolves.toBe("updated")

        expect(tx.committedWrites.map((write) => write.args[0])).toEqual([
            SUPERSEDE_PUBLISHED_LAB_FILES,
            PUBLISH_LAB_FILES_VERSION,
        ])
    })

    it("refuses a version label already stored with other bytes", async () => {
        const { set, tx } = world([
            [SELECT_PUBLISHED_LAB_FILES, liveRow(changed())],
            [
                SELECT_LAB_FILES_VERSION,
                [{ version: courseLabVersionOf(hashOf(labFilesRecordFixture())), content_hash: "f".repeat(64) }],
            ],
        ])

        await expect(set.apply(KEY, labFilesRecordFixture())).rejects.toMatchObject({
            code: "COURSE_LAB_FILES_VERSION_IMMUTABLE",
        })
        expect(tx.committedWrites).toEqual([])
    })

    it("refuses an insert that finds the version already there", async () => {
        const { set } = world([
            [SELECT_PUBLISHED_LAB_FILES, []],
            [SELECT_LAB_FILES_VERSION, []],
            [SUPERSEDE_PUBLISHED_LAB_FILES, []],
            [INSERT_LAB_FILES_VERSION, []],
        ])

        await expect(set.apply(KEY, labFilesRecordFixture())).rejects.toMatchObject({
            code: "COURSE_LAB_FILES_VERSION_IMMUTABLE",
        })
    })

    it("refuses a key that is not the lesson id and a record that is not a files record", async () => {
        const { set } = world([])

        await expect(set.plan("other", labFilesRecordFixture())).rejects.toBeInstanceOf(SeedRefusal)
        await expect(set.apply("other", labFilesRecordFixture())).rejects.toMatchObject({
            code: "COURSE_LAB_FILES_KEY_MISMATCH",
        })
        await expect(set.apply(KEY, { lessonId: KEY })).rejects.toMatchObject({
            code: "COURSE_LAB_FILES_RECORD_INVALID",
        })
    })

    it("lists the lessons with live files and names the lesson id as the identity of held files", async () => {
        const { set } = world([
            [SELECT_PUBLISHED_LAB_FILES_IDS, [{ lesson_id: "a-lab" }, { lesson_id: KEY }]],
            [SELECT_PUBLISHED_LAB_FILES, liveRow(labFilesRecordFixture())],
        ])

        await expect(set.keys()).resolves.toEqual(["a-lab", KEY])
        await expect(set.identityOf(KEY)).resolves.toBe(KEY)
    })

    it("names no identity for files it does not hold", async () => {
        const { set } = world([[SELECT_PUBLISHED_LAB_FILES, []]])

        await expect(set.identityOf(KEY)).resolves.toBeNull()
    })
})
