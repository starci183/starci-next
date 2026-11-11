import { Test } from "@nestjs/testing"
import { MESSAGE_MAPPING_METADATA } from "@nestjs/websockets/constants"
import { mock } from "@starci/jest-preset"
import {
    RelayDeviceService,
    RelayError,
    RelayErrorCode,
    relayDeviceTopic,
    type RelayFrame,
} from "@modules/domain/relay"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { MemoryRealtimeHub, RealtimeModule } from "@modules/platform/realtime"
import { RelayDeviceGateway } from "./relay-device.gateway"
import { RelayDeviceWebsocketModule } from "./relay-device-websocket.module"
import type { RelayDeviceNamespace, RelayDeviceSocket } from "./relay-device-websocket.module"

const LEARNER = "b8099f0e-58c7-4685-8292-f3a49ec994b1"
const DEVICE = "11111111-1111-4111-8111-111111111111"
const TOKEN = "t".repeat(43)

/** The adapter calls middleware first and only then announces a connection. */
const namespaceAnswering = () => {
    let middleware: Parameters<RelayDeviceNamespace["use"]>[0] = (_client, next) => next(new Error("Uninitialized"))
    let connect: Parameters<RelayDeviceNamespace["on"]>[1] = () => undefined
    const namespace: RelayDeviceNamespace = {
        use: (listener) => {
            middleware = listener
        },
        on: (_event, listener) => {
            connect = listener
        },
    }
    const authenticate = (client: RelayDeviceSocket) =>
        new Promise<Error | undefined>((settle) => {
            middleware(client, settle)
        })
    return { namespace, authenticate, connect: (client: RelayDeviceSocket) => connect(client) }
}

/** A socket double that records what it was sent and resolves once `count` frames arrived. */
const socketOf = (auth: Readonly<Record<string, unknown>>, count = 1) => {
    let connected = true
    let onDisconnect: () => void = () => undefined
    const frames: Array<unknown> = []
    let arrived: () => void = () => undefined
    const pushed = new Promise<void>((resolve) => {
        arrived = resolve
    })
    const socket: RelayDeviceSocket = {
        id: "socket-1",
        get connected(): boolean {
            return connected
        },
        handshake: { auth },
        data: {},
        emit: (_event, frame) => {
            frames.push(frame)
            if (frames.length >= count) arrived()
        },
        once: (_event, listener) => {
            onDisconnect = listener
        },
        disconnect: () => {
            connected = false
            onDisconnect()
        },
    }
    return { socket, frames, pushed }
}

const build = async (devices: RelayDeviceService, logger: Logger = mock<Logger>()) => {
    const moduleRef = await Test.createTestingModule({
        imports: [RealtimeModule.register({ hub: "memory" })],
        providers: [RelayDeviceGateway, RelayDeviceWebsocketModule],
    })
        .useMocker((provider) => {
            if (provider === RelayDeviceService) return devices
            return provider === LOGGER ? logger : undefined
        })
        .compile()
    const door = moduleRef.get(RelayDeviceGateway)
    const transport = moduleRef.get(RelayDeviceWebsocketModule)
    const hub = moduleRef.get(MemoryRealtimeHub)
    const adapter = namespaceAnswering()
    door.namespace = adapter.namespace
    await transport.onModuleInit()
    return { door, transport, adapter, hub }
}

const verified = (): RelayDeviceService => {
    const devices = mock<RelayDeviceService>()
    devices.authenticate.mockResolvedValue({ learnerId: LEARNER, deviceId: DEVICE })
    return devices
}

const ack = (eventId: string): RelayFrame => ({ id: `ack:${eventId}`, type: "ack", eventId })

describe("RelayDeviceGateway", () => {
    it("greets the device, then pushes its own topic's frames and none of another device", async () => {
        const { transport, adapter, hub } = await build(verified())
        const { socket, frames, pushed } = socketOf({ deviceToken: TOKEN, topic: "foreign" }, 2)

        await adapter.authenticate(socket)
        adapter.connect(socket)
        await hub.publish(relayDeviceTopic(LEARNER, "22222222-2222-4222-8222-222222222222"), ack("other"))
        await hub.publish(relayDeviceTopic(LEARNER, DEVICE), ack("e-1"))
        await pushed

        expect(frames).toEqual([{ id: "hello:socket-1", type: "hello", deviceId: DEVICE }, ack("e-1")])
        expect(socket.data.principal).toEqual({ id: LEARNER, role: "authenticated" })
        await transport.onModuleDestroy()
    })

    it("resumes after the last frame id the device took", async () => {
        const { transport, adapter, hub } = await build(verified())
        await hub.publish(relayDeviceTopic(LEARNER, DEVICE), ack("e-1"))
        await hub.publish(relayDeviceTopic(LEARNER, DEVICE), ack("e-2"))
        const { socket, frames, pushed } = socketOf({ deviceToken: TOKEN, after: "ack:e-1" }, 2)

        await adapter.authenticate(socket)
        adapter.connect(socket)
        await pushed

        expect(frames[1]).toEqual(ack("e-2"))
        await transport.onModuleDestroy()
    })

    it("releases the subscription on disconnect and says bye on shutdown", async () => {
        const { transport, adapter, hub } = await build(verified())
        const first = socketOf({ deviceToken: TOKEN })
        await adapter.authenticate(first.socket)
        adapter.connect(first.socket)
        await first.pushed
        expect(hub.listenerCount(relayDeviceTopic(LEARNER, DEVICE).name)).toBe(1)

        first.socket.disconnect(true)
        await new Promise((resolve) => setImmediate(resolve))
        expect(hub.listenerCount(relayDeviceTopic(LEARNER, DEVICE).name)).toBe(0)

        const second = socketOf({ deviceToken: TOKEN }, 2)
        await adapter.authenticate(second.socket)
        adapter.connect(second.socket)
        await new Promise((resolve) => setImmediate(resolve))
        await transport.onModuleDestroy()
        await second.pushed
        expect(second.frames[1]).toEqual({ id: "bye:socket-1", type: "bye" })
    })
})

describe("RelayDeviceGateway refusals", () => {
    it.each([{}, { deviceToken: "" }, { deviceToken: 42 }])(
        "refuses %o without asking the device service",
        async (auth) => {
            const devices = verified()
            const { adapter } = await build(devices)
            const { socket } = socketOf(auth)

            expect((await adapter.authenticate(socket))?.message).toContain("RELAY_DEVICE_REVOKED")
            expect(devices.authenticate).not.toHaveBeenCalled()
            expect(socket.data.principal).toBeUndefined()
        },
    )

    it("refuses a revoked token, and a connection that bypassed authentication", async () => {
        const devices = mock<RelayDeviceService>()
        devices.authenticate.mockRejectedValue(new RelayError({ code: RelayErrorCode.DeviceRevoked }))
        const { adapter } = await build(devices)
        const revoked = socketOf({ deviceToken: TOKEN })
        const bypass = socketOf({})

        expect((await adapter.authenticate(revoked.socket))?.message).toContain("RELAY_DEVICE_REVOKED")
        devices.authenticate.mockRejectedValue(new Error("store down"))
        expect((await adapter.authenticate(revoked.socket))?.message).toContain("RELAY_DEVICE_REVOKED")
        adapter.connect(bypass.socket)

        expect(bypass.socket.connected).toBe(false)
    })

    it("logs a stream whose presence cannot be stored and closes its socket, so the device reconnects", async () => {
        const devices = mock<RelayDeviceService>()
        devices.authenticate.mockResolvedValue({ learnerId: LEARNER, deviceId: DEVICE })
        devices.presence.mockRejectedValue(new Error("down"))
        const logger = mock<Logger>()
        const { adapter } = await build(devices, logger)
        const { socket } = socketOf({ deviceToken: TOKEN })

        await adapter.authenticate(socket)
        adapter.connect(socket)
        await new Promise((resolve) => setImmediate(resolve))

        expect(socket.connected).toBe(false)
        expect(logger.error).toHaveBeenCalledWith("relay.stream_failed", expect.any(Error), { deviceId: DEVICE })
    })

    it("has no inbound application message handler", async () => {
        const { door } = await build(verified())

        expect(Reflect.getMetadata(MESSAGE_MAPPING_METADATA, door.frames)).toBeUndefined()
        const methods = Object.getOwnPropertyNames(RelayDeviceGateway.prototype).filter(
            (name) => typeof Object.getOwnPropertyDescriptor(RelayDeviceGateway.prototype, name)?.value === "function",
        )
        expect(methods).toEqual(["constructor", "frames"])
    })
})
