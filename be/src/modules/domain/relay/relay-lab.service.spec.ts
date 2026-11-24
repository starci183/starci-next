import { createHash, generateKeyPairSync, sign, type KeyObject } from "node:crypto"
import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import type { FakeTransaction, MockOf } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { REALTIME_HUB, type RealtimeHub } from "@modules/platform/realtime"
import { RelayErrorCode } from "./errors/relay.error"
import type { RelayDevice } from "./relay.contracts"
import type { RelayUpload, SignedManifest } from "./relay-feed.contracts"
import { RelayDeviceService } from "./relay-device.service"
import { RelayFeedService } from "./relay-feed.service"
import { relayDeviceTopic } from "./relay-feed.policy"
import type { RelayLabContract, RelayLabCut, RelayLabFile, RelayLabGradeFacts } from "./relay-lab.contracts"
import { RELAY_LAB_CONTRACT, type RelayLabContractPort } from "./relay-lab-contract.port"
import { RelayLabService } from "./relay-lab.service"
import { gradePayloadOf } from "./relay-lab.policy"
import {
    GRADE_SUBMISSION,
    INSERT_LAB_EVENT,
    INSERT_SUBMISSION,
    LOCK_LAB_STATE,
    LOCK_LAB_SUBMISSIONS,
    LOCK_SUBMISSION,
    REJECT_OPEN_SUBMISSION,
    REJECT_RUNNING_SUBMISSION,
    SELECT_DEVICE_KEY,
    SELECT_LAB_FILES,
    SELECT_LAB_LOGS,
    SELECT_LAB_SOLVED,
    SELECT_LAB_STATE,
    SELECT_LATEST_SUBMISSION,
    SELECT_OPEN_SUBMISSIONS,
    SET_SUBMISSION_RUNNING,
    UPSERT_LAB_BOOT,
    UPSERT_LAB_FILES,
    UPSERT_LAB_TESTS,
} from "./persistence/relay-lab.sql"

const NOW = "2026-11-25T02:00:00.000Z"
const LEARNER = "b8099f0e-58c7-4685-8292-f3a49ec994b1"
const OTHER_LEARNER = "c9199f0e-58c7-4685-8292-f3a49ec994b2"
const DEVICE = "11111111-1111-4111-8111-111111111111"
const SUBMISSION = "7a1b2c3d-1111-4222-8333-444455556666"
const EVENT = "0c9a2b1e-9a2c-4b6e-8f1a-2b3c4d5e6f70"
const NONCE = "a".repeat(64)
const COMMIT = "b".repeat(40)
const HIDDEN_TEXT = "test('SECRET-HIDDEN-ASSERTION', () => {})"
const HIDDEN_IDS = ["h-order-total", "h-stock-never-negative", "h-idempotent-pay"]

const CONTRACT: RelayLabContract = {
    lab: "shop-oversell",
    branch: "oversell",
    commit: null,
    dir: "app",
    compose: "docker-compose.yml",
    project: "starci-shop-oversell",
    services: ["api", "db"],
    test: {
        command: "npm test",
        scenario: "npm test -- --scenario {id}",
        report: "reports/junit.xml",
        timeoutMs: 120_000,
    },
    files: ["src/order.ts", "src/stock.ts"],
    chaos: [
        {
            id: "slow-db",
            on: "node chaos.js slow-db on",
            off: "node chaos.js slow-db off",
            label: { vi: "Cơ sở dữ liệu chậm", en: "Database slow" },
        },
    ],
    tests: [
        { id: "t-1", name: { vi: "tạo đơn hàng", en: "creates an order" } },
        { id: "t-2", name: { vi: "từ chối bán quá số lượng", en: "refuses an oversell" } },
    ],
    grading: { command: "npm run grade", into: "grader/", scenarios: HIDDEN_IDS },
}

const BUGS_FILES: ReadonlyArray<RelayLabFile> = [
    { path: "app/src/order.ts", text: "export const order = 'buggy'\n" },
    { path: "app/docker-compose.yml", text: "services: {}\n" },
]
const SOLUTION_FILES: ReadonlyArray<RelayLabFile> = [
    { path: "app/src/order.ts", text: "export const order = 'fixed'\n" },
    { path: "app/docker-compose.yml", text: "services: {}\n" },
]

const device = (online: boolean): RelayDevice => ({
    id: DEVICE,
    name: "Laptop",
    platform: "linux",
    pairedAt: NOW,
    lastSeenAt: NOW,
    online,
})

interface Keys {
    readonly privateKey: KeyObject
    readonly publicKey: string
}

const keysOf = (): Keys => {
    const pair = generateKeyPairSync("ed25519")
    return {
        privateKey: pair.privateKey,
        publicKey: pair.publicKey.export({ type: "spki", format: "der" }).toString("base64"),
    }
}

interface World {
    readonly service: RelayLabService
    readonly tx: FakeTransaction
    readonly hub: MockOf<RealtimeHub>
    readonly entitlement: MockOf<EntitlementService>
    readonly devices: MockOf<RelayDeviceService>
    readonly feed: MockOf<RelayFeedService>
    readonly port: MockOf<RelayLabContractPort>
}

const world = async (query: ReadonlyArray<readonly [string, unknown]> = [], online = true): Promise<World> => {
    const stubbed = query.some(([statement]) => statement === SELECT_LAB_SOLVED)
    const tx = fakeTransaction(
        mockEntityManager({
            query: [...query, ...(stubbed ? [] : [[SELECT_LAB_SOLVED, [{ solved: false }]] as const])],
        }),
    )
    const hub = mock<RealtimeHub>()
    hub.publish.mockResolvedValue()
    const entitlement = mock<EntitlementService>()
    entitlement.mayReadEssentialPart.mockResolvedValue(true)
    const devices = mock<RelayDeviceService>()
    devices.devices.mockResolvedValue([device(online)])
    const feed = mock<RelayFeedService>()
    feed.labManifest.mockImplementation((_device, lab) =>
        Promise.resolve({
            body: { manifestId: "m-1", lab },
            payload: "{}",
            signature: "c2ln",
        } as unknown as SignedManifest),
    )
    const port = mock<RelayLabContractPort>()
    port.contractOf.mockResolvedValue(CONTRACT)
    port.labFilesOf.mockImplementation((_course: string, _lesson: string, cut: RelayLabCut) =>
        Promise.resolve(cut === "bugs" ? BUGS_FILES : SOLUTION_FILES),
    )
    port.hiddenTestIdsOf.mockResolvedValue(HIDDEN_IDS)
    port.hiddenOf.mockResolvedValue([
        {
            path: "grader/order.spec.ts",
            sha256: createHash("sha256").update(HIDDEN_TEXT, "utf8").digest("hex"),
            text: HIDDEN_TEXT,
        },
    ])
    const moduleRef = await Test.createTestingModule({
        providers: [
            RelayLabService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: REALTIME_HUB, useValue: hub },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: RELAY_LAB_CONTRACT, useValue: port },
            { provide: RelayDeviceService, useValue: devices },
            { provide: RelayFeedService, useValue: feed },
        ],
    }).compile()
    return { service: moduleRef.get(RelayLabService), tx, hub, entitlement, devices, feed, port }
}

const noWrites = (tx: FakeTransaction): void => {
    expect(tx.committedWrites).toEqual([])
    expect(tx.commits).toBe(0)
}

describe("RelayLabService view", () => {
    const readQueries = (state: unknown[], logs: unknown[] = []) =>
        [
            [SELECT_LAB_STATE, state],
            [SELECT_LAB_LOGS, logs],
            [SELECT_LATEST_SUBMISSION, []],
            [SELECT_LAB_SOLVED, [{ solved: false }]],
        ] as const

    it("needs Premium beyond the free part and a lab the course holds", async () => {
        const free = await world()
        free.entitlement.mayReadEssentialPart.mockResolvedValue(false)
        await expect(free.service.view(LEARNER, "shop", "oversell")).rejects.toMatchObject({
            code: RelayErrorCode.LabPremiumRequired,
        })
        expect(free.port.contractOf).not.toHaveBeenCalled()

        const none = await world()
        none.port.contractOf.mockResolvedValue(null)
        await expect(none.service.view(LEARNER, "shop", "oversell")).rejects.toMatchObject({
            code: RelayErrorCode.LabNotFound,
        })
        await expect(none.service.view(LEARNER, "Shop!", "oversell")).rejects.toMatchObject({
            code: RelayErrorCode.LabNotFound,
        })
    })

    it("reads setup before anything is reported, with no device state and the contract's tests and chaos labels", async () => {
        const { service, devices } = await world(readQueries([]))
        devices.devices.mockResolvedValue([])

        const view = await service.view(LEARNER, "shop", "oversell")

        expect(view).toMatchObject({
            device: "none",
            phase: "setup",
            boot: [],
            files: [],
            chaosOn: [],
            lastSyncedAt: null,
            connectionLost: false,
            solutionUnlocked: false,
            latestSubmission: null,
        })
        expect(view.tests.map((test) => [test.id, test.passed])).toEqual([
            ["t-1", null],
            ["t-2", null],
        ])
        expect(view.chaos).toEqual([{ id: "slow-db", label: { vi: "Cơ sở dữ liệu chậm", en: "Database slow" } }])
        expect(view.tests[0]?.name).toEqual({ vi: "tạo đơn hàng", en: "creates an order" })
        expect(view.logs).toEqual([
            { service: "api", lines: [] },
            { service: "db", lines: [] },
        ])
    })

    it("keeps the last synced files and says the connection is lost when state exists and the device is offline", async () => {
        const state = {
            boot: {
                "first-run": { stage: "first-run", status: "done", detail: "ok", durationMs: 9, at: NOW },
                clone: { stage: "clone", status: "done", detail: "ok", durationMs: 3, at: NOW },
            },
            tests: {
                commit: COMMIT,
                tests: [
                    { id: "t-1", name: "creates an order", passed: true, durationMs: 4, message: "" },
                    {
                        id: "t-2",
                        name: "refuses an oversell",
                        passed: false,
                        durationMs: 5,
                        message: "expected 1, got 2",
                    },
                ],
            },
            files: { commit: COMMIT, files: [{ path: "src/order.ts", text: "export {}", sha256: "d".repeat(64) }] },
            chaos_on: ["slow-db"],
            last_synced_at: new Date(NOW),
        }
        const { service } = await world(readQueries([state]), false)

        const view = await service.view(LEARNER, "shop", "oversell")

        expect(view).toMatchObject({
            device: "offline",
            phase: "ready",
            connectionLost: true,
            chaosOn: ["slow-db"],
            lastSyncedAt: NOW,
            files: [{ path: "src/order.ts", text: "export {}", sha256: "d".repeat(64) }],
        })
        expect(view.boot.map((stage) => stage.stage)).toEqual(["clone", "first-run"])
        expect(view.tests).toEqual([
            {
                id: "t-1",
                name: { vi: "tạo đơn hàng", en: "creates an order" },
                passed: true,
                durationMs: 4,
                message: null,
            },
            {
                id: "t-2",
                name: { vi: "từ chối bán quá số lượng", en: "refuses an oversell" },
                passed: false,
                durationMs: 5,
                message: "expected 1, got 2",
            },
        ])
    })

    it("builds each service's log tail in reading order from the newest chunks", async () => {
        const logs = [
            { check_id: "api", body: "second\nthird", created_at: new Date(NOW) },
            { check_id: "db", body: "db line", created_at: new Date(NOW) },
            { check_id: "api", body: "first", created_at: new Date(NOW) },
        ]
        const { service } = await world(readQueries([], logs))

        const view = await service.view(LEARNER, "shop", "oversell")

        expect(view.logs).toEqual([
            { service: "api", lines: ["first", "second", "third"] },
            { service: "db", lines: ["db line"] },
        ])
    })

    it("shows the verdict of each hidden test of a graded submission by id only, and unlocks the solution once one passed", async () => {
        const submission = {
            id: SUBMISSION,
            status: "graded",
            passed: true,
            reject_reason: null,
            commit_sha: COMMIT,
            tests: [{ id: "h-order-total", passed: true }],
            hints_opened: 1,
            time_spent_ms: 1000,
            created_at: new Date(NOW),
            graded_at: new Date(NOW),
        }
        const { service, port } = await world([
            [SELECT_LAB_STATE, []],
            [SELECT_LAB_LOGS, []],
            [SELECT_LATEST_SUBMISSION, [submission]],
            [SELECT_LAB_SOLVED, [{ solved: true }]],
        ])

        const view = await service.view(LEARNER, "shop", "oversell")

        expect(view.latestSubmission).toMatchObject({
            status: "graded",
            passed: true,
            tests: [{ id: "h-order-total", passed: true }],
        })
        expect(view).toMatchObject({ solutionUnlocked: true })
        expect(view).not.toHaveProperty("solutionRepoUrl")
        expect(port.hiddenOf).not.toHaveBeenCalled()
        expect(JSON.stringify(view)).not.toContain("SECRET-HIDDEN-ASSERTION")
    })
})

describe("RelayLabService doors that ask the machine", () => {
    it("pushes a boot manifest to the online device with the chaos that is already on", async () => {
        const { service, feed } = await world([[SELECT_LAB_STATE, [{ chaos_on: ["slow-db"] }]]])

        await expect(service.start(LEARNER, "shop", "oversell")).resolves.toEqual({
            device: "Laptop",
            action: "boot",
            manifestId: "m-1",
        })
        expect(feed.labManifest).toHaveBeenCalledWith(
            { learnerId: LEARNER, deviceId: DEVICE },
            expect.objectContaining({
                action: "boot",
                chaosOn: ["slow-db"],
                project: "starci-shop-oversell",
                dir: "app",
                source: {
                    url: "/api/relay/courses/shop/oversell/bugs.tgz",
                    sha256: expect.stringMatching(/^[0-9a-f]{64}$/u),
                    commit: expect.stringMatching(/^[0-9a-f]{40}$/u),
                },
                chaos: [{ id: "slow-db", on: "node chaos.js slow-db on", off: "node chaos.js slow-db off" }],
                test: expect.objectContaining({ scenario: "npm test -- --scenario {id}" }),
            }),
        )
        expect(feed.labManifest.mock.calls[0]?.[1]).not.toHaveProperty("solution")
    })

    it("links the solution tarball in the manifest only once a submission of the learner passed", async () => {
        const locked = await world([
            [SELECT_LAB_STATE, []],
            [SELECT_LAB_SOLVED, [{ solved: false }]],
        ])
        await locked.service.start(LEARNER, "shop", "oversell")
        expect(locked.feed.labManifest.mock.calls[0]?.[1]).not.toHaveProperty("solution")
        expect(locked.port.labFilesOf).not.toHaveBeenCalledWith("shop", "oversell", "solution")

        const open = await world([
            [SELECT_LAB_STATE, []],
            [SELECT_LAB_SOLVED, [{ solved: true }]],
        ])
        await open.service.start(LEARNER, "shop", "oversell")
        expect(open.feed.labManifest.mock.calls[0]?.[1]).toMatchObject({
            solution: {
                url: "/api/relay/courses/shop/oversell/solution.tgz",
                sha256: expect.stringMatching(/^[0-9a-f]{64}$/u),
            },
        })
    })

    it("signs nothing when the lesson branch cannot be cut (an empty or unsafe cut)", async () => {
        const { service, port, feed } = await world([[SELECT_LAB_STATE, []]])
        port.labFilesOf.mockResolvedValue([])

        await expect(service.start(LEARNER, "shop", "oversell")).rejects.toMatchObject({
            code: RelayErrorCode.LabNotFound,
        })
        expect(feed.labManifest).not.toHaveBeenCalled()
    })

    it("answers RELAY_DEVICE_OFFLINE with no online device and signs nothing", async () => {
        const { service, feed } = await world([[SELECT_LAB_STATE, []]], false)

        await expect(service.runTests(LEARNER, "shop", "oversell")).rejects.toMatchObject({
            code: RelayErrorCode.DeviceOffline,
        })
        expect(feed.labManifest).not.toHaveBeenCalled()
    })

    it("sets exactly the chaos switches asked, and refuses a switch the lab does not name", async () => {
        const { service, feed } = await world()

        await service.setChaos(LEARNER, "shop", "oversell", ["slow-db"])
        expect(feed.labManifest).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ action: "chaos", chaosOn: ["slow-db"] }),
        )
        await expect(service.setChaos(LEARNER, "shop", "oversell", ["made-up"])).rejects.toMatchObject({
            code: RelayErrorCode.PayloadInvalid,
        })
    })

    it("refuses a free learner before anything is looked up or pushed", async () => {
        const { service, entitlement, feed } = await world()
        entitlement.mayReadEssentialPart.mockResolvedValue(false)

        await expect(service.start(LEARNER, "shop", "oversell")).rejects.toMatchObject({
            code: RelayErrorCode.LabPremiumRequired,
        })
        expect(feed.labManifest).not.toHaveBeenCalled()
    })
})

describe("RelayLabService submit", () => {
    const SUBMIT = { hintsOpened: 2, timeSpentMs: 90_000, designDoc: ["one", "two"] }
    const submitQueries = (open: ReadonlyArray<unknown> = []) =>
        [
            [SELECT_DEVICE_KEY, [{ public_key: keysOf().publicKey }]],
            [LOCK_LAB_SUBMISSIONS, [{ locked: "" }]],
            [SELECT_OPEN_SUBMISSIONS, open],
            [REJECT_OPEN_SUBMISSION, [{ id: "old" }]],
            [INSERT_SUBMISSION, [{ id: SUBMISSION }]],
            [SET_SUBMISSION_RUNNING, [{ id: SUBMISSION }]],
            [SELECT_LAB_STATE, [{ chaos_on: [], files: { commit: COMMIT, files: [] }, tests: null }]],
            [REJECT_RUNNING_SUBMISSION, [{ id: SUBMISSION }]],
        ] as const

    it("stores a queued submission, marks it running and pushes the grade manifest: the hidden files, a permutation of the hidden ids and the nonce", async () => {
        const { service, tx, feed } = await world(submitQueries())

        const result = await service.submit(LEARNER, "shop", "oversell", SUBMIT)

        expect(result).toEqual({ submissionId: SUBMISSION, device: "Laptop", action: "grade", manifestId: "m-1" })
        const insert = tx.em.query.mock.calls.find((call) => call[0] === INSERT_SUBMISSION)
        const [learner, course, lesson, nonce, seedOrder, hints, spent, design, deviceId] = insert?.[1] as Array<string>
        expect([learner, course, lesson, hints, spent, design, deviceId]).toEqual([
            LEARNER,
            "shop",
            "oversell",
            2,
            90_000,
            JSON.stringify(["one", "two"]),
            DEVICE,
        ])
        expect(nonce).toMatch(/^[0-9a-f]{64}$/u)
        expect((JSON.parse(seedOrder ?? "[]") as Array<string>).sort()).toEqual([...HIDDEN_IDS].sort())
        const queries = tx.em.query.mock.calls.map((call) => call[0])
        expect(queries.indexOf(SET_SUBMISSION_RUNNING)).toBeGreaterThan(queries.indexOf(INSERT_SUBMISSION))
        const lab = feed.labManifest.mock.calls[0]?.[1]
        expect(lab).toMatchObject({
            action: "grade",
            grade: { submissionId: SUBMISSION, nonce, commit: COMMIT, command: "npm run grade" },
        })
        expect(lab?.grade?.files.map((file) => file.path)).toEqual(["grader/order.spec.ts"])
        expect(Buffer.from(lab?.grade?.files[0]?.content ?? "", "base64").toString("utf8")).toBe(HIDDEN_TEXT)
        expect([...(lab?.grade?.seedOrder ?? [])].sort()).toEqual([...HIDDEN_IDS].sort())
        expect(tx.commits).toBe(1)
    })

    it("answers RELAY_DEVICE_OFFLINE with no online device, and RELAY_DEVICE_KEY_MISSING when the online device holds no key", async () => {
        const offline = await world(submitQueries(), false)
        await expect(offline.service.submit(LEARNER, "shop", "oversell", SUBMIT)).rejects.toMatchObject({
            code: RelayErrorCode.DeviceOffline,
        })
        noWrites(offline.tx)

        const keyless = await world([[SELECT_DEVICE_KEY, [{ public_key: null }]]])
        await expect(keyless.service.submit(LEARNER, "shop", "oversell", SUBMIT)).rejects.toMatchObject({
            code: RelayErrorCode.DeviceKeyMissing,
        })
        noWrites(keyless.tx)
        expect(keyless.feed.labManifest).not.toHaveBeenCalled()
    })

    it("refuses a second submission while one under fifteen minutes old is still running, and times out an older one", async () => {
        const young = await world(submitQueries([{ id: "open", created_at: new Date("2026-11-25T01:50:00.000Z") }]))
        await expect(young.service.submit(LEARNER, "shop", "oversell", SUBMIT)).rejects.toMatchObject({
            code: RelayErrorCode.LabSubmissionRunning,
        })
        expect(young.tx.rollbacks).toBe(1)
        expect(young.tx.em.query).not.toHaveBeenCalledWith(INSERT_SUBMISSION, expect.anything())

        const stale = await world(submitQueries([{ id: "old", created_at: new Date("2026-11-25T01:30:00.000Z") }]))
        await expect(stale.service.submit(LEARNER, "shop", "oversell", SUBMIT)).resolves.toMatchObject({
            submissionId: SUBMISSION,
        })
        expect(stale.tx.em.query).toHaveBeenCalledWith(REJECT_OPEN_SUBMISSION, ["old", "timed-out", new Date(NOW)])
    })

    it("rejects the submission as push-failed when the manifest cannot be pushed", async () => {
        const { service, tx, feed } = await world(submitQueries())
        feed.labManifest.mockRejectedValue(new Error("hub down"))

        await expect(service.submit(LEARNER, "shop", "oversell", SUBMIT)).rejects.toThrow("hub down")
        expect(tx.em.query).toHaveBeenCalledWith(REJECT_RUNNING_SUBMISSION, [SUBMISSION, "push-failed", new Date(NOW)])
    })

    it("refuses a lab that is not graded, and hidden files outside the grading folder, before anything is stored", async () => {
        const ungraded = await world(submitQueries())
        ungraded.port.contractOf.mockResolvedValue({ ...CONTRACT, grading: null })
        await expect(ungraded.service.submit(LEARNER, "shop", "oversell", SUBMIT)).rejects.toMatchObject({
            code: RelayErrorCode.LabNotFound,
        })
        noWrites(ungraded.tx)

        const stray = await world(submitQueries())
        stray.port.hiddenOf.mockResolvedValue([
            {
                path: "src/order.spec.ts",
                sha256: createHash("sha256").update(HIDDEN_TEXT, "utf8").digest("hex"),
                text: HIDDEN_TEXT,
            },
        ])
        await expect(stray.service.submit(LEARNER, "shop", "oversell", SUBMIT)).rejects.toMatchObject({
            code: RelayErrorCode.Unavailable,
        })
        noWrites(stray.tx)
        expect(stray.feed.labManifest).not.toHaveBeenCalled()
    })

    it("refuses a lab with no hidden test, and a submission outside its bounds, before anything is stored", async () => {
        const hiddenless = await world(submitQueries())
        hiddenless.port.hiddenTestIdsOf.mockResolvedValue([])
        await expect(hiddenless.service.submit(LEARNER, "shop", "oversell", SUBMIT)).rejects.toMatchObject({
            code: RelayErrorCode.LabNotFound,
        })

        const { service, tx } = await world()
        await expect(service.submit(LEARNER, "shop", "oversell", { ...SUBMIT, hintsOpened: -1 })).rejects.toMatchObject(
            {
                code: RelayErrorCode.PayloadInvalid,
            },
        )
        await expect(
            service.submit(LEARNER, "shop", "oversell", { ...SUBMIT, designDoc: ["x".repeat(4001)] }),
        ).rejects.toMatchObject({ code: RelayErrorCode.PayloadInvalid })
        expect(tx.em.query).not.toHaveBeenCalled()
    })
})

const DEVICE_PRINCIPAL = { learnerId: LEARNER, deviceId: DEVICE }
const TASK = "course:shop/oversell"

describe("RelayLabService archive", () => {
    it("hands the lesson branch to the device of a learner who may read the lab, with the hash the manifest signs", async () => {
        const { service, port, feed } = await world([[SELECT_LAB_STATE, []]])

        const archive = await service.archive(DEVICE_PRINCIPAL, "shop", "oversell", "bugs")
        await service.start(LEARNER, "shop", "oversell")

        expect(port.labFilesOf).toHaveBeenCalledWith("shop", "oversell", "bugs")
        expect(archive.content.length).toBeGreaterThan(0)
        expect(archive.sha256).toBe(createHash("sha256").update(archive.content).digest("hex"))
        expect(feed.labManifest.mock.calls[0]?.[1]).toMatchObject({
            source: { sha256: archive.sha256, commit: archive.commit },
        })
    })

    it("refuses the solution before a submission of the learner passed, and cuts it after", async () => {
        const locked = await world([[SELECT_LAB_SOLVED, [{ solved: false }]]])
        await expect(locked.service.archive(DEVICE_PRINCIPAL, "shop", "oversell", "solution")).rejects.toMatchObject({
            code: RelayErrorCode.LabSolutionLocked,
        })
        expect(locked.port.labFilesOf).not.toHaveBeenCalled()

        const open = await world([[SELECT_LAB_SOLVED, [{ solved: true }]]])
        const bugs = await open.service.archive(DEVICE_PRINCIPAL, "shop", "oversell", "bugs")
        const solution = await open.service.archive(DEVICE_PRINCIPAL, "shop", "oversell", "solution")
        expect(open.port.labFilesOf).toHaveBeenCalledWith("shop", "oversell", "solution")
        expect(solution.sha256).not.toBe(bugs.sha256)
    })

    it("needs the lab's part (Premium beyond the free one), a lab and a cut that holds files", async () => {
        const free = await world()
        free.entitlement.mayReadEssentialPart.mockResolvedValue(false)
        await expect(free.service.archive(DEVICE_PRINCIPAL, "shop", "oversell", "bugs")).rejects.toMatchObject({
            code: RelayErrorCode.LabPremiumRequired,
        })

        const none = await world()
        none.port.contractOf.mockResolvedValue(null)
        await expect(none.service.archive(DEVICE_PRINCIPAL, "shop", "oversell", "bugs")).rejects.toMatchObject({
            code: RelayErrorCode.LabNotFound,
        })

        const empty = await world()
        empty.port.labFilesOf.mockResolvedValue([])
        await expect(empty.service.archive(DEVICE_PRINCIPAL, "shop", "oversell", "bugs")).rejects.toMatchObject({
            code: RelayErrorCode.LabNotFound,
        })
    })
})

const upload = (overrides: Partial<RelayUpload>): RelayUpload => ({
    eventId: EVENT,
    kind: "lab.boot",
    taskId: TASK,
    runId: "run-1",
    ...overrides,
})

describe("RelayLabService upload", () => {
    it("applies a boot stage once, resets the boot when the machine stage starts, and acknowledges on the device topic", async () => {
        const { service, tx, hub } = await world([
            [INSERT_LAB_EVENT, [{ event_id: EVENT }]],
            [UPSERT_LAB_BOOT, []],
        ])

        await expect(
            service.upload(
                DEVICE_PRINCIPAL,
                upload({ boot: { stage: "machine", status: "running", detail: "start", durationMs: 0 } }),
            ),
        ).resolves.toEqual({ eventId: EVENT, accepted: true })

        const [, params] = tx.em.query.mock.calls.find((call) => call[0] === UPSERT_LAB_BOOT) ?? []
        expect(params).toEqual([
            LEARNER,
            "shop",
            "oversell",
            DEVICE,
            JSON.stringify({
                machine: { stage: "machine", status: "running", detail: "start", durationMs: 0, at: NOW },
            }),
            new Date(NOW),
            true,
        ])
        expect(hub.publish).toHaveBeenCalledWith(relayDeviceTopic(LEARNER, DEVICE), {
            id: `ack:${EVENT}`,
            type: "ack",
            eventId: EVENT,
        })
    })

    it("changes nothing for a resend of the same client event id and acknowledges it again", async () => {
        const { service, tx, hub } = await world([[INSERT_LAB_EVENT, []]])

        await expect(
            service.upload(
                DEVICE_PRINCIPAL,
                upload({ boot: { stage: "clone", status: "done", detail: "ok", durationMs: 4 } }),
            ),
        ).resolves.toEqual({ eventId: EVENT, accepted: true })

        expect(tx.em.query).not.toHaveBeenCalledWith(UPSERT_LAB_BOOT, expect.anything())
        expect(hub.publish).toHaveBeenCalledTimes(1)
    })

    it("keeps only the visible tests of the contract and the chaos switches the lab names", async () => {
        const { service, tx } = await world([
            [INSERT_LAB_EVENT, [{ event_id: EVENT }]],
            [UPSERT_LAB_TESTS, []],
        ])
        const result = (id: string) => ({ id, name: id, passed: true, durationMs: 1, message: "" })

        await service.upload(
            DEVICE_PRINCIPAL,
            upload({
                kind: "lab.tests",
                labTests: {
                    commit: COMMIT,
                    chaosOn: ["slow-db", "made-up"],
                    tests: [result("t-1"), result("h-order-total")],
                },
            }),
        )

        const [, params] = tx.em.query.mock.calls.find((call) => call[0] === UPSERT_LAB_TESTS) ?? []
        expect(params).toEqual([
            LEARNER,
            "shop",
            "oversell",
            DEVICE,
            JSON.stringify({ commit: COMMIT, tests: [result("t-1")] }),
            JSON.stringify(["slow-db"]),
            new Date(NOW),
        ])
    })

    it("refuses files outside the manifest's list before storing anything", async () => {
        const { service, tx, hub } = await world()

        await expect(
            service.upload(
                DEVICE_PRINCIPAL,
                upload({
                    kind: "lab.files",
                    labFiles: {
                        commit: COMMIT,
                        files: [
                            { path: "src/order.ts", sha256: "d".repeat(64), text: "ok" },
                            { path: ".env", sha256: "e".repeat(64), text: "SECRET=1" },
                        ],
                    },
                }),
            ),
        ).rejects.toMatchObject({ code: RelayErrorCode.PayloadInvalid })

        expect(tx.em.query).not.toHaveBeenCalled()
        expect(hub.publish).not.toHaveBeenCalled()
    })

    it("stores the listed files and a file larger than the cap with no text", async () => {
        const { service, tx } = await world([
            [INSERT_LAB_EVENT, [{ event_id: EVENT }]],
            [LOCK_LAB_STATE, [{ locked: "" }]],
            [SELECT_LAB_FILES, []],
            [UPSERT_LAB_FILES, []],
        ])

        await service.upload(
            DEVICE_PRINCIPAL,
            upload({
                kind: "lab.files",
                labFiles: { commit: COMMIT, files: [{ path: "src/order.ts", sha256: "d".repeat(64), text: null }] },
            }),
        )

        expect(tx.em.query).toHaveBeenCalledWith(UPSERT_LAB_FILES, [
            LEARNER,
            "shop",
            "oversell",
            DEVICE,
            JSON.stringify({ commit: COMMIT, files: [{ path: "src/order.ts", sha256: "d".repeat(64), text: null }] }),
            new Date(NOW),
        ])
    })

    it("merges a partial upload into the files already held: it replaces its own paths and keeps the others", async () => {
        const held = {
            files: {
                commit: "a".repeat(40),
                files: [
                    { path: "src/order.ts", sha256: "1".repeat(64), text: "old order" },
                    { path: "src/stock.ts", sha256: "2".repeat(64), text: "old stock" },
                ],
            },
        }
        const { service, tx } = await world([
            [INSERT_LAB_EVENT, [{ event_id: EVENT }]],
            [LOCK_LAB_STATE, [{ locked: "" }]],
            [SELECT_LAB_FILES, [held]],
            [UPSERT_LAB_FILES, []],
        ])

        await service.upload(
            DEVICE_PRINCIPAL,
            upload({
                kind: "lab.files",
                labFiles: {
                    commit: COMMIT,
                    files: [{ path: "src/order.ts", sha256: "3".repeat(64), text: "new order" }],
                },
            }),
        )

        const queries = tx.em.query.mock.calls.map((call) => call[0])
        expect(queries.indexOf(LOCK_LAB_STATE)).toBeLessThan(queries.indexOf(SELECT_LAB_FILES))
        expect(queries.indexOf(SELECT_LAB_FILES)).toBeLessThan(queries.indexOf(UPSERT_LAB_FILES))
        expect(tx.em.query).toHaveBeenCalledWith(UPSERT_LAB_FILES, [
            LEARNER,
            "shop",
            "oversell",
            DEVICE,
            JSON.stringify({
                commit: COMMIT,
                files: [
                    { path: "src/order.ts", sha256: "3".repeat(64), text: "new order" },
                    { path: "src/stock.ts", sha256: "2".repeat(64), text: "old stock" },
                ],
            }),
            new Date(NOW),
        ])
    })

    it("refuses a lab upload for a lesson with no lab, and an upload that is not valid for its kind", async () => {
        const none = await world()
        none.port.contractOf.mockResolvedValue(null)
        await expect(
            none.service.upload(
                DEVICE_PRINCIPAL,
                upload({ boot: { stage: "clone", status: "done", detail: "ok", durationMs: 1 } }),
            ),
        ).rejects.toMatchObject({ code: RelayErrorCode.LabNotFound })

        const { service } = await world()
        await expect(service.upload(DEVICE_PRINCIPAL, upload({ taskId: "lesson:outbox" }))).rejects.toMatchObject({
            code: RelayErrorCode.PayloadInvalid,
        })
        await expect(service.upload(DEVICE_PRINCIPAL, upload({}))).rejects.toMatchObject({
            code: RelayErrorCode.PayloadInvalid,
        })
    })
})

describe("RelayLabService grading result", () => {
    const keys = keysOf()
    const submissionRow = (overrides: Record<string, unknown> = {}) => ({
        id: SUBMISSION,
        learner_id: LEARNER,
        course_id: "shop",
        lesson_id: "oversell",
        nonce: NONCE,
        status: "running",
        ...overrides,
    })
    const tests = (ids: ReadonlyArray<string>, passed = true) =>
        ids.map((id) => ({ id, passed, durationMs: 7, message: "" }))
    const facts = (overrides: Partial<Omit<RelayLabGradeFacts, "signature">> = {}): RelayLabGradeFacts => {
        const unsigned = {
            submissionId: SUBMISSION,
            nonce: NONCE,
            commit: COMMIT,
            tests: tests(HIDDEN_IDS),
            ...overrides,
        }
        const signature = sign(
            null,
            Buffer.from(gradePayloadOf({ ...unsigned, signature: "" }), "utf8"),
            keys.privateKey,
        )
        return { ...unsigned, signature: signature.toString("base64") }
    }
    const gradeUpload = (grade: RelayLabGradeFacts): RelayUpload => upload({ kind: "lab.grade", grade })
    const gradeQueries = (row: unknown, key: string | null = keys.publicKey) =>
        [
            [SELECT_DEVICE_KEY, [{ public_key: key }]],
            [INSERT_LAB_EVENT, [{ event_id: EVENT }]],
            [LOCK_SUBMISSION, row === null ? [] : [row]],
            [GRADE_SUBMISSION, [{ id: SUBMISSION }]],
            [REJECT_RUNNING_SUBMISSION, [{ id: SUBMISSION }]],
        ] as const

    it("grades a running submission whose result the device signed, keeping each hidden test's verdict and never its message", async () => {
        const { service, tx } = await world(gradeQueries(submissionRow()))

        await expect(service.upload(DEVICE_PRINCIPAL, gradeUpload(facts()))).resolves.toEqual({
            eventId: EVENT,
            accepted: true,
        })

        expect(tx.em.query).toHaveBeenCalledWith(GRADE_SUBMISSION, [
            SUBMISSION,
            COMMIT,
            JSON.stringify(HIDDEN_IDS.map((id) => ({ id, passed: true, durationMs: 7 }))),
            true,
            new Date(NOW),
        ])
    })

    it("grades a result with a red test as not passed", async () => {
        const { service, tx } = await world(gradeQueries(submissionRow()))

        await service.upload(
            DEVICE_PRINCIPAL,
            gradeUpload(facts({ tests: [...tests(HIDDEN_IDS.slice(0, 2)), ...tests(HIDDEN_IDS.slice(2), false)] })),
        )

        const call = tx.em.query.mock.calls.find((each) => each[0] === GRADE_SUBMISSION)
        expect((call?.[1] as Array<unknown>)[3]).toBe(false)
    })

    it("rejects with the nonce-mismatch reason when the nonce is not the submission's, and grades nothing", async () => {
        const { service, tx } = await world(gradeQueries(submissionRow({ nonce: "f".repeat(64) })))

        await service.upload(DEVICE_PRINCIPAL, gradeUpload(facts()))

        expect(tx.em.query).toHaveBeenCalledWith(REJECT_RUNNING_SUBMISSION, [
            SUBMISSION,
            "nonce-mismatch",
            new Date(NOW),
        ])
        expect(tx.em.query).not.toHaveBeenCalledWith(GRADE_SUBMISSION, expect.anything())
    })

    it("rejects with signature-invalid when another key signed the result", async () => {
        const { service, tx } = await world(gradeQueries(submissionRow(), keysOf().publicKey))

        await service.upload(DEVICE_PRINCIPAL, gradeUpload(facts()))

        expect(tx.em.query).toHaveBeenCalledWith(REJECT_RUNNING_SUBMISSION, [
            SUBMISSION,
            "signature-invalid",
            new Date(NOW),
        ])
    })

    it("rejects with tests-mismatch when a hidden test id is missing from a validly signed result", async () => {
        const { service, tx } = await world(gradeQueries(submissionRow()))

        await service.upload(DEVICE_PRINCIPAL, gradeUpload(facts({ tests: tests(HIDDEN_IDS.slice(0, 2)) })))

        expect(tx.em.query).toHaveBeenCalledWith(REJECT_RUNNING_SUBMISSION, [
            SUBMISSION,
            "tests-mismatch",
            new Date(NOW),
        ])
    })

    it("refuses another learner's submission without changing it: the transaction rolls back", async () => {
        const { service, tx, hub } = await world(gradeQueries(submissionRow({ learner_id: OTHER_LEARNER })))

        await expect(service.upload(DEVICE_PRINCIPAL, gradeUpload(facts()))).rejects.toMatchObject({
            code: RelayErrorCode.GradeRejected,
        })

        expect(tx.rollbacks).toBe(1)
        expect(tx.em.query).not.toHaveBeenCalledWith(REJECT_RUNNING_SUBMISSION, expect.anything())
        expect(tx.em.query).not.toHaveBeenCalledWith(GRADE_SUBMISSION, expect.anything())
        expect(hub.publish).not.toHaveBeenCalled()
    })

    it("refuses a result that names no submission, or the submission of another lab", async () => {
        const unknown = await world(gradeQueries(null))
        await expect(unknown.service.upload(DEVICE_PRINCIPAL, gradeUpload(facts()))).rejects.toMatchObject({
            code: RelayErrorCode.GradeRejected,
        })

        const elsewhere = await world(gradeQueries(submissionRow({ lesson_id: "other-lesson" })))
        await expect(elsewhere.service.upload(DEVICE_PRINCIPAL, gradeUpload(facts()))).rejects.toMatchObject({
            code: RelayErrorCode.GradeRejected,
        })
    })

    it("leaves a submission that is no longer running untouched and writes no rejection over it", async () => {
        const { service, tx } = await world(gradeQueries(submissionRow({ status: "graded" })))

        await service.upload(DEVICE_PRINCIPAL, gradeUpload(facts()))

        expect(tx.em.query).not.toHaveBeenCalledWith(GRADE_SUBMISSION, expect.anything())
        expect(tx.em.query).not.toHaveBeenCalledWith(REJECT_RUNNING_SUBMISSION, expect.anything())
    })

    it("rejects with device-key-missing when the uploading device registered no key", async () => {
        const { service, tx } = await world(gradeQueries(submissionRow(), null))

        await service.upload(DEVICE_PRINCIPAL, gradeUpload(facts()))

        expect(tx.em.query).toHaveBeenCalledWith(REJECT_RUNNING_SUBMISSION, [
            SUBMISSION,
            "device-key-missing",
            new Date(NOW),
        ])
    })
})
