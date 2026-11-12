import { io, type Socket } from "socket.io-client"
import { TestWorldError, TestWorldErrorCode, type TestApi } from "@starci/test-world"
import { learnersOf } from "../fixtures/builders/identity.builder"
import { RELAY_DEVICE_PRESENCE } from "../fixtures/persistence/relay.sql"
import { identityDoors, type IdentityDoors } from "./identity-doors.client"
import type { useTestWorld } from "./use-test-world"

/**
 * The device side of the relay world: a booted core world with a paired device, its push-only socket (the real `socket.io-client`)
 * and the frames it received, shared by the relay feed and realtime integration specs.
 */

/** One frame the relay pushes to a device. */
export interface Frame {
    readonly id: string
    readonly type: string
    readonly eventId?: string
}

/** A device's socket and every frame it received, oldest first. */
export interface DeviceStream {
    readonly socket: Socket
    readonly frames: Array<Frame>
    /** The first frame (already received or still to come) the predicate holds for. */
    frame(holds: (frame: Frame) => boolean): Promise<Frame>
}

/** The row count of a counting query (`SELECT count(*)::int AS n`). */
export interface CountRow {
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
export interface ManifestData {
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
export interface DevicesBody {
    readonly data: DevicesData
}

/** Whether a device is online now and whether the relay ever heard from it. */
export interface PresenceRow {
    readonly online: boolean
    readonly seen: boolean
}

export const CONFIRM = `mutation ($input: RelayUserCodeInput!) { confirmRelayDevice(input: $input) { id online } }`
export const REVOKE = `mutation ($input: RevokeRelayDeviceInput!) { revokeRelayDevice(input: $input) { id } }`
export const DEVICES = `query { relayDevices { id online lastSeenAt } }`
export const MANIFEST = `query ($input: RelayManifestInput!) { relayManifest(input: $input) { manifestId payload signature } }`
export const STARTED = `mutation ($input: RelayCheckStartedInput!) { relayCheckStarted(input: $input) { eventId accepted } }`
export const EVENT_ID = "0c9a2b1e-9a2c-4b6e-8f1a-2b3c4d5e6f70"

/** A caller waiting for the first frame its predicate holds for. */
interface Waiting {
    readonly holds: (frame: Frame) => boolean
    readonly take: (frame: Frame) => void
}

/** Opens the push-only device socket with a device token, resuming after a frame id when given. */
export const connect = (baseUrl: string, deviceToken: string, after?: string): Promise<DeviceStream> =>
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

/** The booted core world a relay spec drives: what `useTestWorld({ modules: identityModules, apps: ["core"] })` answers. */
export type RelayWorld = ReturnType<typeof useTestWorld>

/** A paired device: its id, its token and the session cookie of the learner it belongs to. */
export interface PairedDevice {
    readonly cookie: string
    readonly deviceId: string
    readonly deviceToken: string
}

/** What every relay scenario drives: the booted world, the doors of its core app, a paired device and the device sockets. */
export interface RelayContext {
    readonly world: RelayWorld
    /** The identity doors of the core app. */
    doors(): IdentityDoors
    /** The REST and GraphQL doors of the core app. */
    relay(): TestApi
    /** The primary database of the world. */
    primary(): NonNullable<RelayWorld["db"]["primary"]>
    /** Signs a new learner in and pairs one device. */
    paired(): Promise<PairedDevice>
    /** The presence row of a device. */
    presenceOf(deviceId: string): Promise<PresenceRow | undefined>
    /** Opens the device socket with a token, resuming after a frame id when given; it is closed after the scenario. */
    streamOf(deviceToken: string, after?: string): Promise<DeviceStream>
}

/**
 * The doors and device sockets of a booted relay world. Call it inside `describe`, after `useTestWorld`: it resets the doors before
 * each scenario and closes every socket it opened after it. `learnerPrefix` (1 to 8 hex digits) keeps the learners of one spec file
 * apart from another's.
 */
export const relayContext = (world: RelayWorld, learnerPrefix: string): RelayContext => {
    const doors = (): IdentityDoors => identityDoors(world)
    const nextLearner = learnersOf(learnerPrefix)
    const relay = (): TestApi => {
        const app = world.apps.core
        if (app === undefined)
            throw new TestWorldError({
                code: TestWorldErrorCode.NotDeclared,
                params: { detail: "the relay world boots the core app" },
            })
        return app.api
    }
    const primary = (): NonNullable<RelayWorld["db"]["primary"]> => {
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

    const paired = async (): Promise<PairedDevice> => {
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
