import { generateKeyPairSync, verify } from "node:crypto"
import { FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
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
    serviceKey: null,
}

const build = async (em: MockEntityManager, signingKeyPem: string | null = null) => {
    const hub = mock<RealtimeHub>()
    hub.publish.mockResolvedValue()
    const relayOptions = {
        ...OPTIONS,
        manifestSigningKey: signingKeyPem === null ? null : { reveal: () => signingKeyPem },
    }
    const moduleRef = await Test.createTestingModule({
        providers: [
            RelayFeedService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: REALTIME_HUB, useValue: hub },
            { provide: RELAY_OPTIONS, useValue: relayOptions },
        ],
    }).compile()
    return { feed: moduleRef.get(RelayFeedService), hub }
}

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
            concepts: ["server-state-cache-lifecycle", "cqrs-read-models", "transactions-and-isolation", "indexing-and-query-plans"],
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
