import { io, type Socket } from "socket.io-client"
import { TestWorldError, TestWorldErrorCode, type TestApi } from "@starci/test-world"
import { learnersOf } from "../../fixtures/builders/identity.builder"
import { COUNT_RELAY_EVENTS, RELAY_DEVICE_PRESENCE } from "../../fixtures/persistence/relay.sql"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** One frame the relay pushes to a device. */
interface Frame {
    readonly id: string
    readonly type: string
    readonly eventId?: string
}

/** A device's socket and every frame it received, oldest first. */
interface DeviceStream {
    readonly socket: Socket
    readonly frames: Array<Frame>
    /** The first frame (already received or still to come) the predicate holds for. */
    frame(holds: (frame: Frame) => boolean): Promise<Frame>
}

/** A count row. */
interface CountRow {
    readonly n: number
}

/** The pairing a device started. */
interface PairingStart {
    readonly deviceCode: string
    readonly userCode: string
}

/** The device a learner confirmed. */
interface ConfirmedDevice {
    readonly id: string
}

/** The data of the confirm mutation. */
interface ConfirmData {
    readonly confirmRelayDevice: ConfirmedDevice
}

/** The body of the confirm mutation. */
interface ConfirmBody {
    readonly data: ConfirmData
}

/** The token a confirmed pairing hands the device. */
interface DeviceTokenBody {
    readonly deviceToken: string
}

/** A manifest the relay issued. */
interface IssuedManifest {
    readonly manifestId: string
}

/** The data of the manifest query. */
interface ManifestData {
    readonly relayManifest: IssuedManifest
}

/** A device as the learner's device list shows it. */
interface ListedDevice {
    readonly online: boolean
    readonly lastSeenAt: string | null
}

/** The data of the device list query. */
interface DevicesData {
    readonly relayDevices: Array<ListedDevice>
}

/** The body of the device list query. */
interface DevicesBody {
    readonly data: DevicesData
}

/** A presence row. */
interface PresenceRow {
    readonly online: boolean
    readonly seen: boolean
}

const CONFIRM = `mutation ($input: RelayUserCodeInput!) { confirmRelayDevice(input: $input) { id online } }`
const REVOKE = `mutation ($input: RevokeRelayDeviceInput!) { revokeRelayDevice(input: $input) { id } }`
const DEVICES = `query { relayDevices { id online lastSeenAt } }`
const MANIFEST = `query ($input: RelayManifestInput!) { relayManifest(input: $input) { manifestId payload signature } }`
const STARTED = `mutation ($input: RelayCheckStartedInput!) { relayCheckStarted(input: $input) { eventId accepted } }`
const EVENT_ID = "0c9a2b1e-9a2c-4b6e-8f1a-2b3c4d5e6f70"

/** A caller waiting for the first frame its predicate holds for. */
interface Waiting {
    readonly holds: (frame: Frame) => boolean
    readonly take: (frame: Frame) => void
}

/** Opens the push-only device socket with a device token, resuming after a frame id when given. */
const connect = (baseUrl: string, deviceToken: string, after?: string): Promise<DeviceStream> =>
    new Promise((resolve, reject) => {
        const socket = io(`${baseUrl}/device`, {
            transports: ["websocket"],
            reconnection: false,
            auth: { deviceToken, after },
        })
        const frames: Array<Frame> = []
        const waiting: Array<Waiting> = []
        socket.on("relay", (frame: Frame) => {
            frames.push(frame)
            waiting.filter((wait) => wait.holds(frame)).forEach((wait) => wait.take(frame))
        })
        const frame = (holds: (frame: Frame) => boolean): Promise<Frame> => {
            const known = frames.find((candidate) => holds(candidate))
            return known === undefined ? new Promise((take) => waiting.push({ holds, take })) : Promise.resolve(known)
        }
        socket.once("connect_error", (error) =>
            reject(
                new TestWorldError({
                    code: TestWorldErrorCode.InfrastructureFailed,
                    params: { detail: error.message },
                    cause: error,
                }),
            ),
        )
        socket.once("connect", () => resolve({ socket, frames, frame }))
    })

/** The booted world of this spec and the doors every scenario drives. */
const relayContext = () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core", "relay"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("r2")
    const relay = (): TestApi => {
        const app = world.apps.relay
        if (app === undefined)
            throw new TestWorldError({
                code: TestWorldErrorCode.NotDeclared,
                params: { detail: "the relay world boots the relay app" },
            })
        return app.api
    }
    const primary = () => {
        const database = world.db.primary
        if (database === undefined)
            throw new TestWorldError({
                code: TestWorldErrorCode.NotDeclared,
                params: { detail: "the relay world runs the primary database" },
            })
        return database
    }
    const open: Array<Socket> = []
    beforeEach(() => doors().reset())
    afterEach(() => open.splice(0).forEach((socket) => socket.disconnect()))

    /** Signs a learner in and pairs one device: its id, its token and the learner's session cookie. */
    const paired = async () => {
        const cookie = await doors().signIn(nextLearner())
        const pairing = (
            await doors().post<PairingStart>("/api/relay/devices/start", { deviceName: "Laptop", platform: "linux" })
        ).body
        const confirmed = await doors().post<ConfirmBody>(
            "/graphql",
            { query: CONFIRM, variables: { input: { userCode: pairing.userCode } } },
            { cookie },
        )
        const token = await doors().post<DeviceTokenBody>("/api/relay/devices/token", {
            deviceCode: pairing.deviceCode,
        })
        return { cookie, deviceId: confirmed.body.data.confirmRelayDevice.id, deviceToken: token.body.deviceToken }
    }
    const presenceOf = async (deviceId: string): Promise<PresenceRow | undefined> =>
        (await primary().query<Array<PresenceRow>>(RELAY_DEVICE_PRESENCE, [deviceId]))[0]
    const streamOf = async (deviceToken: string, after?: string): Promise<DeviceStream> => {
        const stream = await connect(relay().baseUrl, deviceToken, after)
        open.push(stream.socket)
        return stream
    }
    return { world, doors, relay, primary, paired, presenceOf, streamOf }
}

/** The scenarios share one booted world. */
type RelayContext = ReturnType<typeof relayContext>

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
 * The learner relay of the real relay app beside the core doors (decision.relay.placement, contract.relay.channel): a paired
 * device opens its push-only socket (online), receives its signed manifest and the ack of each upload, re-uploads under the
 * same client event id without a second row, resumes after the last frame it took, and is refused once revoked.
 */
describe("relay feed (integration)", () => {
    const context = relayContext()

    it("relay/run-task: online while connected, manifest and ack pushed, re-upload stored once, resume after the last frame", () =>
        runTask(context))

    it("relay/revoked: a revoked device's uploads and socket are refused", () => revoked(context))
})
