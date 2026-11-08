import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign, type KeyObject } from "node:crypto"
import type { RealtimeTopic } from "@modules/platform/realtime"
import type { ManifestBody, ManifestCheck, RelayFrame, RelayUpload, SignedManifest } from "./relay-feed.contracts"

/** The longest log text an upload carries. */
export const LOG_TEXT_MAX = 16_384
const ID_MAX = 100
const SLOTS: ReadonlySet<string> = new Set(["test", "e2e", "probe"])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
const SAFE_ID = /^[A-Za-z0-9._:/-]{1,100}$/u

/** The id of the manifest a device is issued for a task at an instant: the same three facts always name the same manifest. */
export const manifestIdOf = (deviceId: string, taskId: string, issuedAt: string): string =>
    createHash("sha256").update(`${deviceId}|${taskId}|${issuedAt}`).digest("hex").slice(0, 32)

/** The checks every project task allows: its own test script, run in the workspace root, ten minutes at most. */
export const PROJECT_CHECKS: ReadonlyArray<ManifestCheck> = [
    { id: "test", command: "npm test", cwd: ".", timeoutMs: 600_000 },
]

/** The push topic of one paired device, inside its learner's prefix (BE-REALTIME-3). */
export const relayDeviceTopic = (learnerId: string, deviceId: string): RealtimeTopic<RelayFrame> => ({
    name: `relay:${learnerId}:${deviceId}`,
})

/** The canonical JSON of a manifest body: keys in a fixed order, so the CLI verifies the exact signed text. */
export const manifestPayloadOf = (body: ManifestBody): string =>
    JSON.stringify({
        manifestId: body.manifestId,
        taskId: body.taskId,
        learnerId: body.learnerId,
        deviceId: body.deviceId,
        issuedAt: body.issuedAt,
        checks: body.checks.map((check) => ({
            id: check.id,
            command: check.command,
            cwd: check.cwd,
            timeoutMs: check.timeoutMs,
        })),
    })

/** Signs a manifest body with the relay's Ed25519 key. */
export const signManifest = (body: ManifestBody, key: KeyObject): SignedManifest => {
    const payload = manifestPayloadOf(body)
    return { body, payload, signature: sign(null, Buffer.from(payload, "utf8"), key).toString("base64") }
}

/** The relay's signing key: the sealed PEM when one is configured, else a key made for this process (development only). */
export const signingKeyOf = (pem: string | null): KeyObject =>
    pem === null ? generateKeyPairSync("ed25519").privateKey : createPrivateKey(pem)

/** The SPKI PEM of the public half of a signing key, which the CLI ships to verify manifests. */
export const publicKeyPemOf = (key: KeyObject): string =>
    createPublicKey(key).export({ type: "spki", format: "pem" }).toString()

/** True when an optional text is absent or a short safe id. */
const safeOptional = (value: string | undefined): boolean => value === undefined || SAFE_ID.test(value)

/** True when an optional number is absent or a whole number within bounds. */
const boundedOptional = (value: number | undefined): boolean =>
    value === undefined || (Number.isSafeInteger(value) && value >= -1 && value <= 86_400_000)

/** True when the facts a result needs are present and bounded. */
const resultFacts = (upload: RelayUpload): boolean =>
    upload.checkId !== undefined &&
    upload.passed !== undefined &&
    (upload.slot === undefined || SLOTS.has(upload.slot)) &&
    (upload.ref === undefined || upload.ref.length <= 300) &&
    (upload.commit === undefined || /^[0-9a-f]{7,40}$/u.test(upload.commit))

/** True when an upload is well formed for its kind; anything else is RELAY_PAYLOAD_INVALID. */
export const uploadValid = (upload: RelayUpload): boolean => {
    if (!UUID.test(upload.eventId) || !SAFE_ID.test(upload.taskId) || !SAFE_ID.test(upload.runId)) return false
    if (![upload.checkId, upload.conceptId, upload.manifestId].every((value) => safeOptional(value))) return false
    if (!boundedOptional(upload.exitCode) || !boundedOptional(upload.durationMs)) return false
    switch (upload.kind) {
        case "check.started":
            return upload.checkId !== undefined
        case "check.result":
            return resultFacts(upload)
        case "log":
            return upload.checkId !== undefined && upload.text !== undefined && upload.text.length <= LOG_TEXT_MAX
        case "manifest.ack":
            return upload.manifestId !== undefined && upload.manifestId.length <= ID_MAX
    }
}
