import { generateKeyPairSync, verify } from "node:crypto"
import { checkSetServiceOf } from "@tests/fixtures/builders/check-set.builder"
import { ProjectCheckSetService } from "@modules/domain/project/project-check-set.service"
import { FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { HarnessErrorCode, HarnessReadService } from "@modules/domain/harness"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { REALTIME_HUB, type RealtimeHub } from "@modules/platform/realtime"
import { RelayErrorCode } from "./errors/relay.error"
import { RELAY_OPTIONS } from "./relay.decorators"
import { RelayFeedService } from "./relay-feed.service"
import { publicKeyPemOf, relayDeviceTopic } from "./relay-feed.policy"
import { INSERT_EVENT } from "./persistence/relay-events.sql"

const NOW = "2026-11-09T02:00:00.000Z"
const DEVICE = { learnerId: "b8099f0e-58c7-4685-8292-f3a49ec994b1", deviceId: "11111111-1111-4111-8111-111111111111" }
const EVENT = "0c9a2b1e-9a2c-4b6e-8f1a-2b3c4d5e6f70"
const OPTIONS = {
    verifyUrl: "",
    pairingTtlSeconds: 600,
    premiumDeviceLimit: 2,
    freeDeviceLimit: 1,
    manifestSigningKey: null,
}

const build = async (
    em: MockEntityManager,
    signingKeyPem: string | null = null,
    premium = true,
    harness: HarnessReadService = mock<HarnessReadService>(),
) => {
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(premium)
    const hub = mock<RealtimeHub>()
    hub.publish.mockResolvedValue()
    const relayOptions = {
        ...OPTIONS,
        manifestSigningKey: signingKeyPem === null ? null : { reveal: () => signingKeyPem },
    }
    const moduleRef = await Test.createTestingModule({
        providers: [
            RelayFeedService,
            { provide: ProjectCheckSetService, useValue: checkSetServiceOf() },
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: REALTIME_HUB, useValue: hub },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: RELAY_OPTIONS, useValue: relayOptions },
            { provide: HarnessReadService, useValue: harness },
        ],
    }).compile()
    return { feed: moduleRef.get(RelayFeedService), hub, entitlement }
}

describe("RelayFeedService projects are subscription-only", () => {
    const UPLOAD = {
        eventId: EVENT,
        kind: "check.result" as const,
        taskId: "p-1",
        runId: "r-1",
        checkId: "test",
        passed: true,
        exitCode: 0,
        durationMs: 5,
    }

    it("refuses a project manifest and a project run request from a learner without Premium, and pushes nothing", async () => {
        const em = mockEntityManager()
        const { feed, hub } = await build(em, null, false)

        await expect(feed.manifest(DEVICE, "project-1")).rejects.toMatchObject({
            code: RelayErrorCode.ProjectPremiumRequired,
        })
        await expect(feed.manifest(DEVICE, "project-1", { milestone: "bf-http-foundation" })).rejects.toMatchObject({
            code: RelayErrorCode.ProjectPremiumRequired,
        })
        expect(hub.publish).not.toHaveBeenCalled()
    })

    it("refuses a project upload from a learner without Premium: nothing is stored and nothing is acknowledged", async () => {
        const em = mockEntityManager()
        const { feed, hub } = await build(em, null, false)

        await expect(feed.upload(DEVICE, UPLOAD)).rejects.toMatchObject({
            code: RelayErrorCode.ProjectPremiumRequired,
        })
        expect(em.query).not.toHaveBeenCalledWith(INSERT_EVENT, expect.anything())
        expect(hub.publish).not.toHaveBeenCalled()
    })

    it("accepts the same upload from a subscriber", async () => {
        const { feed } = await build(mockEntityManager({ query: [INSERT_EVENT, [{ event_id: EVENT }]] }), null, true)

        await expect(feed.upload(DEVICE, UPLOAD)).resolves.toMatchObject({ accepted: true })
    })
})

describe("RelayFeedService /harness is free", () => {
    const STAGE = {
        eventId: EVENT,
        kind: "check.result" as const,
        taskId: "harness:build:agent-cli",
        runId: "r-1",
        checkId: "s1-loop",
        slot: "harness-stage",
        ref: "loop-calls-tool",
        buildId: "agent-cli",
        stageId: "s1-loop",
        passed: true,
        envPresent: ["ANTHROPIC_API_KEY"],
    }

    it("stores a harness stage result from a learner without Premium and keeps the key names in detail", async () => {
        const em = mockEntityManager({ query: [INSERT_EVENT, [{ event_id: EVENT }]] })
        const { feed } = await build(em, null, false)

        await expect(feed.upload(DEVICE, STAGE)).resolves.toMatchObject({ accepted: true })

        const [, params] = em.query.mock.calls.find(([text]) => text === INSERT_EVENT) ?? []
        expect(params).toEqual(expect.arrayContaining(["harness-stage", "loop-calls-tool"]))
        expect(JSON.parse(String((params as ReadonlyArray<unknown>)[16]))).toMatchObject({
            envPresent: ["ANTHROPIC_API_KEY"],
        })
    })

    it("refuses a stage result whose task names another build", async () => {
        const { feed } = await build(mockEntityManager(), null, false)

        await expect(feed.upload(DEVICE, { ...STAGE, taskId: "harness:build:other" })).rejects.toMatchObject({
            code: RelayErrorCode.PayloadInvalid,
        })
    })

    it("signs the harness section of a build manifest for a learner without Premium", async () => {
        const harness = mock<HarnessReadService>()
        harness.storedBuilds.mockResolvedValue([
            {
                id: "agent-cli",
                order: 1,
                title: { vi: "a", en: "a" },
                summary: { vi: "", en: "" },
                keys: [{ id: "llm", anyOf: ["ANTHROPIC_API_KEY"], note: null }],
                runtime: { dir: "source", install: "npm ci", e2e: "npm run e2e", report: "e2e/reports/junit.xml" },
                stages: [
                    {
                        id: "s1-loop",
                        order: 1,
                        title: { vi: "a", en: "a" },
                        summary: { vi: "", en: "" },
                        e2e: ["x"],
                        steps: [],
                    },
                ],
                packPaths: [],
            },
        ])
        harness.pack.mockResolvedValue({ content: Buffer.from("tgz"), sha256: "a".repeat(64), commit: "b".repeat(40) })
        const { feed, hub } = await build(mockEntityManager(), null, false, harness)

        const signed = await feed.manifest(DEVICE, "harness:build:agent-cli")

        expect(signed.body.checks).toEqual([])
        expect(signed.body.harness).toMatchObject({
            kind: "build",
            buildId: "agent-cli",
            source: {
                url: "/api/relay/harness/build/agent-cli/source.tgz",
                sha256: "a".repeat(64),
                commit: "b".repeat(40),
            },
            stages: [{ id: "s1-loop", e2e: ["x"] }],
        })
        expect(JSON.parse(signed.payload)).toHaveProperty("harness.keys", [{ id: "llm", anyOf: ["ANTHROPIC_API_KEY"] }])
        expect(hub.publish).toHaveBeenCalledTimes(1)
    })

    it("signs the doctor section of a tool and the trial section of a trap from their packs", async () => {
        const harness = mock<HarnessReadService>()
        harness.pack.mockResolvedValue({ content: Buffer.from("tgz"), sha256: "c".repeat(64), commit: "d".repeat(40) })
        const { feed } = await build(mockEntityManager(), null, false, harness)

        const doctor = await feed.manifest(DEVICE, "harness:doctor:codex")
        const trial = await feed.manifest(DEVICE, "harness:trial:red-test")

        expect(doctor.body.harness).toEqual({
            kind: "doctor",
            tool: "codex",
            source: {
                url: "/api/relay/harness/doctor/codex/probes.tgz",
                sha256: "c".repeat(64),
                commit: "d".repeat(40),
            },
        })
        expect(trial.body.harness).toMatchObject({ kind: "trial", trap: "red-test" })
        expect(harness.pack).toHaveBeenCalledWith("doctor-pack", "codex")
        expect(harness.pack).toHaveBeenCalledWith("trap", "red-test")
        expect(doctor.body.checks).toEqual([])
    })

    it("refuses the manifest of a build the catalog does not have", async () => {
        const harness = mock<HarnessReadService>()
        harness.storedBuilds.mockResolvedValue([])
        const { feed, hub } = await build(mockEntityManager(), null, true, harness)

        await expect(feed.manifest(DEVICE, "harness:build:ghost")).rejects.toMatchObject({
            code: HarnessErrorCode.NotFound,
        })
        expect(hub.publish).not.toHaveBeenCalled()
    })
})

describe("RelayFeedService manifest", () => {
    it("issues a signed manifest of the project checks and pushes it to the device", async () => {
        const { feed, hub } = await build(mockEntityManager())

        const signed = await feed.manifest(DEVICE, "project-1")

        expect(signed.body).toMatchObject({ taskId: "project-1", ...DEVICE, issuedAt: NOW })
        expect(signed.body.checks.map((check) => check.id)).toEqual(["test"])
        expect(hub.publish).toHaveBeenCalledWith(relayDeviceTopic(DEVICE.learnerId, DEVICE.deviceId), {
            id: `manifest:${signed.body.manifestId}`,
            type: "manifest",
            manifest: signed,
        })
    })

    it("signs with the configured StarCi key, which the CLI verifies with its public half", async () => {
        const key = generateKeyPairSync("ed25519").privateKey
        const pem = key.export({ type: "pkcs8", format: "pem" }).toString()
        const { feed } = await build(mockEntityManager(), pem)

        const signed = await feed.manifest(DEVICE, "project-1")

        const isSigned = verify(
            null,
            Buffer.from(signed.payload, "utf8"),
            publicKeyPemOf(key),
            Buffer.from(signed.signature, "base64"),
        )
        expect(isSigned).toBe(true)
    })

    it("issues a project run manifest with the learner's command and the milestone plan", async () => {
        const { feed } = await build(mockEntityManager())

        const signed = await feed.manifest(DEVICE, "project-1", {
            milestone: "bf-data-and-cache",
            testCommand: "node --test",
        })

        expect(signed.body.checks).toEqual([{ id: "test", command: "node --test", cwd: ".", timeoutMs: 600_000 }])
        expect(signed.body.plan).toEqual({
            milestone: "bf-data-and-cache",
            report: "starci/reports/junit.xml",
            concepts: ["cache-freshness", "cursor-pagination"],
        })
        expect(signed.payload).toContain('"plan":{"milestone":"bf-data-and-cache"')
    })

    it("refuses a project run whose command cannot be one", async () => {
        const { feed, hub } = await build(mockEntityManager())

        await expect(
            feed.manifest(DEVICE, "project-1", { milestone: "bf-data-and-cache", testCommand: "a\nb" }),
        ).rejects.toMatchObject({ code: RelayErrorCode.PayloadInvalid })
        await expect(feed.manifest(DEVICE, "project-1", { milestone: "no-such" })).rejects.toMatchObject({
            code: RelayErrorCode.PayloadInvalid,
        })
        expect(hub.publish).not.toHaveBeenCalled()
    })

    it("refuses a task id that cannot be one", async () => {
        const { feed } = await build(mockEntityManager())

        await expect(feed.manifest(DEVICE, "a b")).rejects.toMatchObject({ code: RelayErrorCode.PayloadInvalid })
    })
})

describe("RelayFeedService upload", () => {
    it("stores a result once per client event id and acknowledges it on the device topic, a resend included", async () => {
        const em = mockEntityManager({ query: [INSERT_EVENT, [{ event_id: EVENT }]] })
        const { feed, hub } = await build(em)
        const upload = {
            eventId: EVENT,
            kind: "check.result" as const,
            taskId: "p-1",
            runId: "r-1",
            checkId: "test",
            passed: true,
            exitCode: 0,
            durationMs: 5,
        }

        await expect(feed.upload(DEVICE, upload)).resolves.toEqual({ eventId: EVENT, accepted: true })
        expect(hub.publish).toHaveBeenCalledWith(relayDeviceTopic(DEVICE.learnerId, DEVICE.deviceId), {
            id: `ack:${EVENT}`,
            type: "ack",
            eventId: EVENT,
        })
        expect(em.query).toHaveBeenCalledWith(INSERT_EVENT, [
            DEVICE.deviceId,
            EVENT,
            DEVICE.learnerId,
            "check.result",
            "p-1",
            "r-1",
            "test",
            null,
            null,
            null,
            true,
            0,
            5,
            null,
            null,
            new Date(NOW),
            null,
        ])
    })

    it("stores the manifest id of an ack and the text of a log", async () => {
        const em = mockEntityManager({ query: [INSERT_EVENT, []] })
        const { feed } = await build(em)

        await feed.upload(DEVICE, {
            eventId: EVENT,
            kind: "manifest.ack",
            taskId: "p-1",
            runId: "r-1",
            manifestId: "m-1",
        })
        await feed.upload(DEVICE, {
            eventId: EVENT,
            kind: "log",
            taskId: "p-1",
            runId: "r-1",
            checkId: "test",
            text: "line",
        })

        const params = em.query.mock.calls.map((call): unknown => call[1])
        expect(params.map((row): unknown => (Array.isArray(row) ? row[14] : undefined))).toEqual(["m-1", "line"])
    })

    it("refuses a malformed upload before storing it, and answers the relay unavailable when the store fails", async () => {
        const em = mockEntityManager()
        em.query.mockRejectedValue(new Error("down"))
        const { feed } = await build(em)

        await expect(feed.upload(DEVICE, { eventId: "x", kind: "log", taskId: "p", runId: "r" })).rejects.toMatchObject(
            {
                code: RelayErrorCode.PayloadInvalid,
            },
        )
        await expect(
            feed.upload(DEVICE, { eventId: EVENT, kind: "check.started", taskId: "p", runId: "r", checkId: "test" }),
        ).rejects.toMatchObject({ code: RelayErrorCode.Unavailable })
    })
})

describe("RelayFeedService scenarioManifest", () => {
    it("signs one scenario run under the lesson task and pushes it to the device", async () => {
        const { feed, hub } = await build(mockEntityManager())

        const signed = await feed.scenarioManifest(DEVICE, {
            lessonId: "bank-transfer",
            scenarioId: "double-spend",
            guardsOff: ["idempotency"],
        })

        expect(signed.body).toMatchObject({
            taskId: "lesson:bank-transfer",
            ...DEVICE,
            issuedAt: NOW,
            checks: [
                {
                    id: "double-spend",
                    command: "starci-relay run bank-transfer --scenario double-spend --guard idempotency=off",
                    cwd: ".",
                },
            ],
        })
        expect(hub.publish).toHaveBeenCalledTimes(1)
    })

    it("refuses an id that is not a slug", async () => {
        const { feed, hub } = await build(mockEntityManager())

        await expect(
            feed.scenarioManifest(DEVICE, { lessonId: "bank-transfer", scenarioId: "a; rm -rf /", guardsOff: [] }),
        ).rejects.toMatchObject({ code: RelayErrorCode.PayloadInvalid })
        expect(hub.publish).not.toHaveBeenCalled()
    })
})

describe("RelayFeedService lab tasks", () => {
    const LOG = {
        eventId: EVENT,
        kind: "log" as const,
        taskId: "course:shop/oversell",
        runId: "r-1",
        checkId: "api",
        text: "listening",
    }

    it("never issues a lab manifest through the generic door, whatever the plan", async () => {
        const { feed, hub } = await build(mockEntityManager(), null, true)

        await expect(feed.manifest(DEVICE, "course:shop/oversell")).rejects.toMatchObject({
            code: RelayErrorCode.PayloadInvalid,
        })
        expect(hub.publish).not.toHaveBeenCalled()
    })

    it("signs a lab manifest through labManifest and pushes it as the manifest frame", async () => {
        const { feed, hub } = await build(mockEntityManager(), null, true)

        const signed = await feed.labManifest(DEVICE, {
            courseId: "shop",
            lessonId: "oversell",
            repo: { url: "https://git.example/labs/shop.git", branch: "oversell", commit: null },
            compose: "lab",
            project: "starci-shop-oversell",
            services: ["api"],
            seed: { command: "npm run seed", timeoutMs: 1000 },
            test: { command: "npm test", report: "r.xml", timeoutMs: 1000 },
            files: [],
            chaos: [],
            chaosOn: [],
            action: "boot",
        })

        expect(signed.body).toMatchObject({ taskId: "course:shop/oversell", checks: [], lab: { action: "boot" } })
        expect(JSON.parse(signed.payload)).toMatchObject({ lab: { project: "starci-shop-oversell" } })
        expect(hub.publish).toHaveBeenCalledWith(
            relayDeviceTopic(DEVICE.learnerId, DEVICE.deviceId),
            expect.objectContaining({ type: "manifest" }),
        )
    })

    it("stores a service log of a lab task without Premium (the lab doors hold the gate)", async () => {
        const { feed } = await build(mockEntityManager({ query: [INSERT_EVENT, [{ event_id: EVENT }]] }), null, false)

        await expect(feed.upload(DEVICE, LOG)).resolves.toMatchObject({ accepted: true })
    })

    it("leaves the four lab kinds to the lab service: the generic upload refuses them and stores nothing", async () => {
        const em = mockEntityManager()
        const { feed, hub } = await build(em, null, true)

        await expect(
            feed.upload(DEVICE, {
                eventId: EVENT,
                kind: "lab.boot",
                taskId: "course:shop/oversell",
                runId: "r-1",
                boot: { stage: "clone", status: "done", detail: "ok", durationMs: 1 },
            }),
        ).rejects.toMatchObject({ code: RelayErrorCode.PayloadInvalid })
        expect(em.query).not.toHaveBeenCalled()
        expect(hub.publish).not.toHaveBeenCalled()
    })
})
