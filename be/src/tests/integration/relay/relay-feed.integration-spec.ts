import {
    connect,
    DEVICES,
    EVENT_ID,
    MANIFEST,
    REVOKE,
    STARTED,
    relayContext,
    type CountRow,
    type DevicesBody,
    type ManifestData,
    type RelayContext,
} from "../../world/relay-device-stream.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"
import { COUNT_RELAY_EVENTS } from "../../fixtures/persistence/relay.sql"

const REVOKED = { params: { detail: "RELAY_DEVICE_REVOKED" } }

/** Online while connected, manifest and ack pushed, re-upload stored once, resume after the last frame. */
const runTask = async ({ world, doors, relay, primary, paired, presenceOf, streamOf }: RelayContext): Promise<void> => {
    const device = await paired()
    expect(await presenceOf(device.deviceId)).toEqual({ online: false, seen: false })

    const stream = await streamOf(device.deviceToken)
    await stream.frame((frame) => frame.type === "hello")
    await world.waitUntil(
        "device online",
        () => presenceOf(device.deviceId),
        (row) => row?.online === true,
    )

    const manifest = await relay()
        .bearing(device.deviceToken)
        .graphql<ManifestData>(MANIFEST, { input: { taskId: "project-1" } })
    const manifestId = manifest.data?.relayManifest.manifestId ?? ""
    const pushed = await stream.frame((frame) => frame.id === `manifest:${manifestId}`)

    const upload = { input: { eventId: EVENT_ID, taskId: "project-1", runId: "run-1", checkId: "test" } }
    const first = await relay().bearing(device.deviceToken).graphql(STARTED, upload)
    const again = await relay().bearing(device.deviceToken).graphql(STARTED, upload)
    await stream.frame((frame) => frame.type === "ack" && frame.eventId === EVENT_ID)
    const stored = await primary().query<Array<CountRow>>(COUNT_RELAY_EVENTS, [device.deviceId])

    expect(manifest.errorCode).toBeNull()
    expect(pushed.type).toBe("manifest")
    expect(first.data).toEqual({ relayCheckStarted: { eventId: EVENT_ID, accepted: true } })
    expect(again.data).toEqual(first.data)
    expect(stored[0]?.n).toBe(1)

    stream.socket.disconnect()
    await world.waitUntil(
        "device offline",
        () => presenceOf(device.deviceId),
        (row) => row?.online === false,
    )
    const listed = await doors().post<DevicesBody>("/graphql", { query: DEVICES }, { cookie: device.cookie })
    expect(listed.body.data.relayDevices[0]).toMatchObject({ online: false })
    expect(listed.body.data.relayDevices[0]?.lastSeenAt).not.toBeNull()

    const resumed = await streamOf(device.deviceToken, pushed.id)
    const replayed = await resumed.frame((frame) => frame.type === "ack")

    expect(replayed.eventId).toBe(EVENT_ID)
    expect(resumed.frames.some((frame) => frame.id === pushed.id)).toBe(false)
}

/** A revoked device's uploads and socket are refused. */
const revoked = async ({ doors, relay, paired }: RelayContext): Promise<void> => {
    const device = await paired()
    await doors().post(
        "/graphql",
        { query: REVOKE, variables: { input: { id: device.deviceId } } },
        { cookie: device.cookie },
    )

    const upload = await relay()
        .bearing(device.deviceToken)
        .graphql(STARTED, { input: { eventId: EVENT_ID, taskId: "project-1", runId: "run-1", checkId: "test" } })

    expect(upload.errorCode).toBe("RELAY_DEVICE_REVOKED")
    await expect(connect(relay().baseUrl, device.deviceToken)).rejects.toMatchObject(REVOKED)
    await expect(connect(relay().baseUrl, "")).rejects.toMatchObject(REVOKED)
}

/**
 * The learner relay of the real core app beside its pairing doors (decision.relay.placement, contract.relay.channel): a paired
 * device opens its push-only socket (online), receives its signed manifest and the ack of each upload, re-uploads under the
 * same client event id without a second row, resumes after the last frame it took, and is refused once revoked.
 */
describe("relay feed (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const context = relayContext(world, "d2")

    it("relay/run-task: online while connected, manifest and ack pushed, re-upload stored once, resume after the last frame", () =>
        runTask(context))

    it("relay/revoked: a revoked device's uploads and socket are refused", () => revoked(context))
})
