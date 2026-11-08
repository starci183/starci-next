import { generateKeyPairSync, verify } from "node:crypto"
import { Test } from "@nestjs/testing"
import type { RelayUpload } from "./relay-feed.contracts"
import {
    PROJECT_CHECKS,
    manifestPayloadOf,
    publicKeyPemOf,
    relayDeviceTopic,
    signManifest,
    signingKeyOf,
    uploadValid,
} from "./relay-feed.policy"

const POLICY: unique symbol = Symbol("spec.relay-feed-policy")
const policy = { manifestPayloadOf, publicKeyPemOf, relayDeviceTopic, signManifest, signingKeyOf, uploadValid }

const build = async (): Promise<typeof policy> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policy }],
    }).compile()
    return moduleRef.get(POLICY)
}

/** What reading a signed payload answered: its value, or the parse failure as the cause. */
type PayloadRead =
    { readonly kind: "read"; readonly value: unknown } | { readonly kind: "unreadable"; readonly cause: unknown }

/** The value a signed payload carries; a payload that is not JSON answers its parse failure. */
const payloadOf = (text: string): PayloadRead => {
    try {
        return { kind: "read", value: JSON.parse(text) }
    } catch (cause) {
        return { kind: "unreadable", cause }
    }
}

const body = {
    manifestId: "m-1",
    taskId: "project-1",
    learnerId: "learner-1",
    deviceId: "device-1",
    issuedAt: "2026-11-09T02:00:00.000Z",
    checks: PROJECT_CHECKS,
}

const base: RelayUpload = {
    eventId: "0c9a2b1e-9a2c-4b6e-8f1a-2b3c4d5e6f70",
    kind: "check.started",
    taskId: "project-1",
    runId: "run-1",
    checkId: "test",
}

describe("relay feed policy signing", () => {
    it("builds the device topic inside its learner's prefix", async () => {
        const { relayDeviceTopic: topicOf } = await build()

        expect(topicOf("learner-1", "device-1")).toEqual({ name: "relay:learner-1:device-1" })
    })

    it("signs the canonical payload with Ed25519, verifiable with the public key the CLI ships", async () => {
        const subject = await build()
        const { privateKey } = generateKeyPairSync("ed25519")
        const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString()
        const key = subject.signingKeyOf(pem)

        const signed = subject.signManifest(body, key)

        expect(signed.payload).toBe(subject.manifestPayloadOf(body))
        expect(payloadOf(signed.payload)).toEqual({ kind: "read", value: body })
        expect(
            verify(
                null,
                Buffer.from(signed.payload),
                subject.publicKeyPemOf(key),
                Buffer.from(signed.signature, "base64"),
            ),
        ).toBe(true)
        expect(
            verify(
                null,
                Buffer.from(`${signed.payload} `),
                subject.publicKeyPemOf(key),
                Buffer.from(signed.signature, "base64"),
            ),
        ).toBe(false)
    })

    it("makes a key of its own when no sealed key is configured", async () => {
        const subject = await build()

        expect(subject.publicKeyPemOf(subject.signingKeyOf(null))).toContain("BEGIN PUBLIC KEY")
    })
})

describe("relay feed policy uploads", () => {
    it.each<[string, RelayUpload]>([
        ["a started check", base],
        [
            "a result",
            {
                ...base,
                kind: "check.result",
                passed: true,
                exitCode: 0,
                durationMs: 12,
                slot: "test",
                ref: "suite > case",
                commit: "abc1234",
                conceptId: "guard",
            },
        ],
        ["a log chunk", { ...base, kind: "log", text: "ok" }],
        ["a manifest ack", { ...base, kind: "manifest.ack", checkId: undefined, manifestId: "m-1" }],
    ])("accepts %s", async (_case, upload) => {
        const { uploadValid: valid } = await build()

        expect(valid(upload)).toBe(true)
    })

    it.each<[string, RelayUpload]>([
        ["an event id that is no uuid", { ...base, eventId: "1" }],
        ["a task id with spaces", { ...base, taskId: "a b" }],
        ["a run id too long", { ...base, runId: "r".repeat(101) }],
        ["a check id with a slash-dot escape", { ...base, checkId: "a b" }],
        ["a started check without its check", { ...base, checkId: undefined }],
        ["a result without passed", { ...base, kind: "check.result" }],
        ["a result with an unknown slot", { ...base, kind: "check.result", passed: true, slot: "unit" }],
        ["a result with a long ref", { ...base, kind: "check.result", passed: true, ref: "r".repeat(301) }],
        ["a result with a bad commit", { ...base, kind: "check.result", passed: true, commit: "HEAD" }],
        ["an exit code out of bounds", { ...base, kind: "check.result", passed: false, exitCode: 1.5 }],
        ["a duration out of bounds", { ...base, kind: "check.result", passed: false, durationMs: 90_000_000 }],
        ["a log without text", { ...base, kind: "log" }],
        ["a log over 16 KiB", { ...base, kind: "log", text: "x".repeat(16_385) }],
        ["an ack without its manifest", { ...base, kind: "manifest.ack" }],
    ])("refuses %s", async (_case, upload) => {
        const { uploadValid: valid } = await build()

        expect(valid(upload)).toBe(false)
    })
})
