import { mock, mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { RELAY_LAB_CONTRACT, type RelayLabContractPort } from "@modules/domain/relay"
import { hiddenFilesValid, labArchiveOf } from "@modules/domain/relay/relay-lab.policy"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { CourseLabContractAdapter } from "./course-lab-contract.adapter"
import { CourseLabService } from "./course-lab.service"
import { courseRecordFixture, labFileFixture, labFilesRecordFixture, labRecordFixture } from "./course-lab.testing"
import {
    SELECT_LAB_FILES_HIDDEN,
    SELECT_LAB_FILES_META,
    SELECT_LAB_FILES_NESTJS,
    SELECT_CASE_MARKS,
    SELECT_LAB_FILES_SOURCE,
    SELECT_LATEST_CASE_RUNS,
    SELECT_PUBLISHED_COURSE,
    SELECT_PUBLISHED_LAB,
} from "./persistence/course.sql"

const COURSE = "shop-giay"
const LESSON = "saga-compensation"
const LEARNER_ID = "b8099f0e-58c7-4685-8292-f3a49ec994b1"

interface Held {
    readonly course?: unknown
    readonly lab?: unknown
    readonly files?: Record<string, unknown>
    readonly marks?: unknown
    readonly runs?: unknown
}

const CASE_IDS = ["h1", "h2", "u1", "u2", "u3"]

/** Every case of the fixture lab marked green once. */
const everGreenRows = CASE_IDS.map((case_id) => ({ case_id, hints_opened: 0, ever_green: true }))

/** The newest stored run of every case of the fixture lab, green unless named red. */
const latestRows = (...red: Array<string>) =>
    CASE_IDS.map((case_id) => ({
        case_id,
        status: red.includes(case_id) ? "red" : "green",
        ran_at: new Date("2026-11-25T02:00:00.000Z"),
        duration_ms: 900,
        learner_commit: "a".repeat(40),
        failed: red.includes(case_id) ? { invariant: null, message: "red again" } : null,
    }))

const world = async (held: Held = {}) => {
    const files = held.files ?? labFilesRecordFixture()
    const em = mockEntityManager({
        query: [
            [SELECT_PUBLISHED_COURSE, held.course === undefined ? [{ record: courseRecordFixture() }] : held.course],
            [
                SELECT_PUBLISHED_LAB,
                held.lab === undefined
                    ? [{ version: "abc123def456", content_hash: "a".repeat(64), record: labRecordFixture() }]
                    : held.lab,
            ],
            [
                SELECT_LAB_FILES_META,
                [
                    {
                        meta: {
                            base: files.base,
                            test: files.test,
                            grader: files.grader,
                            nestjsFiles: (files.framework as { nestjs: Array<unknown> }).nestjs.length,
                        },
                    },
                ],
            ],
            [SELECT_LAB_FILES_SOURCE, [{ files: files.source }]],
            [SELECT_LAB_FILES_NESTJS, [{ files: (files.framework as { nestjs: unknown }).nestjs }]],
            [SELECT_LAB_FILES_HIDDEN, [{ files: files.hidden }]],
            [SELECT_CASE_MARKS, held.marks ?? []],
            [SELECT_LATEST_CASE_RUNS, held.runs ?? []],
        ],
    })
    const entitlement = mock<EntitlementService>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            CourseLabContractAdapter,
            CourseLabService,
            { provide: RELAY_LAB_CONTRACT, useExisting: CourseLabContractAdapter },
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
        ],
    }).compile()
    return {
        port: moduleRef.get<RelayLabContractPort>(RELAY_LAB_CONTRACT),
        adapter: moduleRef.get(CourseLabContractAdapter),
        em,
    }
}

describe("CourseLabContractAdapter as the relay's lab contract port", () => {
    it("is what the relay token resolves to", async () => {
        const { port, adapter } = await world()

        expect(port).toBe(adapter)
    })

    describe("contractOf", () => {
        it("builds the contract of a lesson the live course names from the lab record and the lab files", async () => {
            const { port } = await world()

            await expect(port.contractOf(COURSE, LESSON)).resolves.toMatchObject({
                lab: "shop-giay",
                dir: ".",
                compose: "docker-compose.yml",
                project: "starci-shop-giay-saga-compensation",
                services: ["orders", "payments"],
                learnerFile: "services/orders/src/checkout.ts",
                frameworks: ["nestjs"],
                test: { command: "npm test", scenario: "npm test -- --case {id}", timeoutMs: 900000 },
                grading: { into: "grader/", matrix: { steps: ["order", "payment", "stock"] } },
            })
        })

        it("reads no file text to build it", async () => {
            const { port, em } = await world()

            await port.contractOf(COURSE, LESSON)

            const asked = em.query.mock.calls.map((call) => call[0])
            expect(asked).not.toContain(SELECT_LAB_FILES_SOURCE)
            expect(asked).not.toContain(SELECT_LAB_FILES_HIDDEN)
            expect(asked).not.toContain(SELECT_LAB_FILES_NESTJS)
        })

        it("is null for a course that does not exist, a lesson the course does not name, ids that are no slug and a lesson with no live record", async () => {
            await expect((await world({ course: [] })).port.contractOf(COURSE, LESSON)).resolves.toBeNull()
            await expect((await world()).port.contractOf(COURSE, "idempotency-key-x")).resolves.toBeNull()
            await expect((await world()).port.contractOf("Not A Slug", LESSON)).resolves.toBeNull()
            await expect((await world()).port.contractOf(COURSE, "../x")).resolves.toBeNull()
            await expect((await world({ lab: [] })).port.contractOf(COURSE, LESSON)).resolves.toBeNull()
        })
    })

    describe("labFilesOf", () => {
        it("returns the c0 learner checkout for the lesson branch, as path and text", async () => {
            const { port } = await world()

            await expect(port.labFilesOf(COURSE, LESSON, "bugs")).resolves.toEqual([
                { path: "docker-compose.yml", text: "name: shop-giay\n" },
                { path: "package.json", text: "{}\n" },
                { path: "services/orders/src/checkout.ts", text: "// c0\n" },
            ])
        })

        it("returns the NestJS version for the framework cut", async () => {
            const { port } = await world()

            await expect(port.labFilesOf(COURSE, LESSON, "framework:nestjs")).resolves.toEqual([
                { path: "apps/orders/src/saga/steps.ts", text: "// nest\n" },
            ])
        })

        it("returns nothing for the solution, which the set does not carry", async () => {
            const { port, em } = await world()

            await expect(port.labFilesOf(COURSE, LESSON, "solution")).resolves.toEqual([])
            expect(em.query).not.toHaveBeenCalled()
        })

        it("returns nothing for a lesson the course does not name, and never a hidden file for any cut", async () => {
            await expect((await world({ course: [] })).port.labFilesOf(COURSE, LESSON, "bugs")).resolves.toEqual([])

            const { port } = await world()
            for (const cut of ["bugs", "solution", "framework:nestjs"] as const) {
                const files = await port.labFilesOf(COURSE, LESSON, cut)
                expect(JSON.stringify(files)).not.toContain("SECRET-GRADER")
                expect(files.every((file) => !file.path.startsWith("grader/"))).toBe(true)
            }
        })
    })

    describe("hiddenOf and hiddenTestIdsOf", () => {
        it("returns the hidden files, each under the grader folder, with the hash of its text", async () => {
            const { port } = await world()
            const hidden = await port.hiddenOf(COURSE, LESSON)

            expect(hidden.map((file) => file.path)).toEqual(["grader/jest.config.js", "grader/matrix.test.ts"])
            expect(hidden[1]).toEqual(labFileFixture("grader/matrix.test.ts", "// SECRET-GRADER\n"))
        })

        it("returns the twelve cell ids as the hidden test ids", async () => {
            const { port } = await world()
            const ids = await port.hiddenTestIdsOf(COURSE, LESSON)

            expect(ids).toHaveLength(12)
            expect(ids).toContain("payment-lost-response")
        })

        it("returns nothing for a lesson the course does not name", async () => {
            const { port } = await world({ course: [] })

            await expect(port.hiddenOf(COURSE, LESSON)).resolves.toEqual([])
            await expect(port.hiddenTestIdsOf(COURSE, LESSON)).resolves.toEqual([])
        })
    })

    describe("the path safety the relay enforces over what the port returns", () => {
        it("signs a lesson branch tarball: every path relative, posix, unique and outside hidden/", async () => {
            const { port } = await world()
            const contract = await port.contractOf(COURSE, LESSON)
            if (contract === null) throw new Error("no contract")

            const bugs = labArchiveOf(contract, await port.labFilesOf(COURSE, LESSON, "bugs"))
            const nest = labArchiveOf(contract, await port.labFilesOf(COURSE, LESSON, "framework:nestjs"))

            expect(bugs?.sha256).toMatch(/^[0-9a-f]{64}$/u)
            expect(bugs?.commit).toMatch(/^[0-9a-f]{40}$/u)
            expect(nest?.sha256).toMatch(/^[0-9a-f]{64}$/u)
        })

        it("refuses to sign an empty cut, so the solution is never shipped", async () => {
            const { port } = await world()
            const contract = await port.contractOf(COURSE, LESSON)
            if (contract === null) throw new Error("no contract")

            expect(labArchiveOf(contract, await port.labFilesOf(COURSE, LESSON, "solution"))).toBeNull()
        })

        it("accepts the hidden files as sound: under grading.into, hashes that match their text", async () => {
            const { port } = await world()
            const contract = await port.contractOf(COURSE, LESSON)

            expect(hiddenFilesValid(await port.hiddenOf(COURSE, LESSON), contract?.grading ?? null)).toBe(true)
        })

        it("would refuse a tarball or a hidden list with an unsafe path, which the relay checks again on its own", async () => {
            const { port } = await world()
            const contract = await port.contractOf(COURSE, LESSON)
            if (contract === null) throw new Error("no contract")

            for (const path of ["/etc/passwd", "../x", "a/../x", "a//b", ".git/config", "hidden/a", "a\\b"])
                expect(labArchiveOf(contract, [{ path, text: "x" }])).toBeNull()
            expect(
                labArchiveOf(contract, [
                    { path: "a", text: "x" },
                    { path: "a", text: "y" },
                ]),
            ).toBeNull()
            expect(hiddenFilesValid([labFileFixture("src/outside.ts", "x")], contract.grading)).toBe(false)
            expect(
                hiddenFilesValid([{ path: "grader/a.ts", sha256: "0".repeat(64), text: "x" }], contract.grading),
            ).toBe(false)
            expect(hiddenFilesValid([labFileFixture("grader/../x.ts", "x")], contract.grading)).toBe(false)
        })
    })
    describe("casesGreenOf, the submit gate", () => {
        it("is true only when the newest run of every case is green", async () => {
            const { port } = await world({ marks: everGreenRows, runs: latestRows() })

            await expect(port.casesGreenOf(LEARNER_ID, COURSE, LESSON)).resolves.toBe(true)
        })

        it("is false when a case green once is red on its newest run: ever green opens the next case, it never passes the gate", async () => {
            const { port } = await world({ marks: everGreenRows, runs: latestRows("u2") })

            await expect(port.casesGreenOf(LEARNER_ID, COURSE, LESSON)).resolves.toBe(false)
        })

        it("is false before any run and for a lesson the course does not name", async () => {
            await expect((await world()).port.casesGreenOf(LEARNER_ID, COURSE, LESSON)).resolves.toBe(false)
            await expect(
                (await world({ course: [], marks: everGreenRows, runs: latestRows() })).port.casesGreenOf(
                    LEARNER_ID,
                    COURSE,
                    LESSON,
                ),
            ).resolves.toBe(false)
        })
    })
})
