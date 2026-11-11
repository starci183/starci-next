import { Module, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common"
import { RelayDeviceService, RelayError, RelayErrorCode, RelayLogEvent, type RelayFrame } from "@modules/domain/relay"
import type { Principal } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ConfigurableModuleClass } from "./relay-device-websocket.module-definition"
import { RelayDeviceGateway } from "./relay-device.gateway"

/** The event every relay frame travels on. */
const RELAY_EVENT = "relay"

/** What a connection told the relay it holds: the device and the last frame id it took. */
interface RelayConnectionData {
    principal?: Principal
    deviceId?: string
    after?: string | undefined
}

/** The frames this transport sends besides the hub's: the greeting on connect and the farewell on shutdown. */
type RelayEnvelope =
    | RelayFrame
    | { readonly id: string; readonly type: "hello"; readonly deviceId: string }
    | { readonly id: string; readonly type: "bye" }

/** The handshake of a connection: untrusted input, of which only the device token and the last frame id are read. */
interface RelayHandshake {
    /** The auth payload the client sent. */
    readonly auth: Readonly<Record<string, unknown>>
}

/** The socket.io surface used here; the adapter and the socket library remain owned by platform/realtime. */
export interface RelayDeviceSocket {
    /** The adapter's connection identifier. */
    readonly id: string
    /** Whether the connection is still open. */
    readonly connected: boolean
    /** Untrusted handshake input: only the device token and the last frame id are read. */
    readonly handshake: RelayHandshake
    /** Server-side state: middleware replaces any previous principal with the verified device. */
    readonly data: RelayConnectionData
    /** Sends one frame to this authenticated socket. */
    emit(event: typeof RELAY_EVENT, frame: RelayEnvelope): void
    /** Releases the stream when the connection ends. */
    once(event: "disconnect", listener: () => void): void
    /** Closes a refused or failed connection. */
    disconnect(close: boolean): void
}

/** A namespace from the app's socket.io adapter. No inbound application events are registered. */
export interface RelayDeviceNamespace {
    /** Runs authentication before the connection event. */
    use(middleware: (client: RelayDeviceSocket, next: (error?: Error) => void) => void): void
    /** Automatically opens the authenticated device's push stream. */
    on(event: "connection", listener: (client: RelayDeviceSocket) => void): void
}

/** One open device stream: its hub iterator and the socket it forwards to. */
interface RelayStream {
    /** The device's hub subscription. */
    readonly iterator: AsyncIterator<RelayFrame>
    /** The connection the frames go to. */
    readonly client: RelayDeviceSocket
}

@Module({ providers: [RelayDeviceGateway] })
/**
 * The relay socket transport: verifies each connection's device token, greets it, forwards the device's hub frames after
 * the last id it took (resume), and releases every disconnected subscription. Nothing the device sends is read.
 */
export class RelayDeviceWebsocketModule extends ConfigurableModuleClass implements OnModuleInit, OnModuleDestroy {
    private readonly streams = new Map<string, RelayStream>()

    constructor(
        private readonly gateway: RelayDeviceGateway,
        private readonly devices: RelayDeviceService,
        @InjectLogger() private readonly logger: Logger,
    ) {
        super()
    }

    /** Nest creates gateway namespaces before module initialization and starts listening afterwards; no socket is open yet. */
    async onModuleInit(): Promise<void> {
        await this.devices.clearPresence()
        this.gateway.namespace.use((client, next) => {
            void this.authenticate(client).then(
                () => next(),
                (error: unknown) => {
                    this.logger.warn(RelayLogEvent.SocketRefused, {
                        reason: error instanceof RelayError ? error.code : "store",
                    })
                    next(new RelayError({ code: RelayErrorCode.DeviceRevoked, cause: error }))
                },
            )
        })
        this.gateway.namespace.on("connection", (client) => {
            void this.push(client).then(undefined, (error: unknown) => this.fail(client, error))
        })
    }

    /** Says bye to every open device and releases all hub iterators when the app shuts down. */
    async onModuleDestroy(): Promise<void> {
        const open = [...this.streams.entries()]
        open.forEach(([id, stream]) => stream.client.emit(RELAY_EVENT, { id: `bye:${id}`, type: "bye" }))
        await Promise.all(open.map(([id]) => this.release(id)))
    }

    /** Proves the handshake's device token; a resume reads only the last frame id, never a topic or a principal. */
    private async authenticate(client: RelayDeviceSocket): Promise<void> {
        delete client.data.principal
        delete client.data.deviceId
        const token = client.handshake.auth.deviceToken
        if (typeof token !== "string" || token.length === 0)
            throw new RelayError({ code: RelayErrorCode.DeviceRevoked })
        const device = await this.devices.authenticate(token)
        const after = client.handshake.auth.after
        client.data.principal = { id: device.learnerId, role: "authenticated" }
        client.data.deviceId = device.deviceId
        client.data.after = typeof after === "string" && after.length <= 200 ? after : undefined
    }

    /** Greets the device, then forwards its frames until it disconnects. */
    private async push(client: RelayDeviceSocket): Promise<void> {
        const { principal, deviceId, after } = client.data
        if (principal === undefined || deviceId === undefined) {
            client.disconnect(true)
            return
        }
        const iterator = this.gateway.frames(principal, deviceId, after)[Symbol.asyncIterator]()
        this.streams.set(client.id, { iterator, client })
        client.once("disconnect", () => {
            void this.release(client.id).then(undefined, (error: unknown) => this.fail(client, error))
        })
        await this.devices.presence(deviceId, true)
        client.emit(RELAY_EVENT, { id: `hello:${client.id}`, type: "hello", deviceId })
        try {
            await this.forward(client, iterator)
        } finally {
            await this.release(client.id)
        }
    }

    /** Forwards the next hub frame to the device while it is connected, one frame after the other. */
    private async forward(client: RelayDeviceSocket, iterator: AsyncIterator<RelayFrame>): Promise<void> {
        const frame = await iterator.next()
        if (frame.done || !client.connected) return
        client.emit(RELAY_EVENT, frame.value)
        await this.forward(client, iterator)
    }

    /** Records a failed stream and closes its socket; the device reconnects and resumes after its last frame. */
    private fail(client: RelayDeviceSocket, error: unknown): void {
        this.logger.error(RelayLogEvent.StreamFailed, error, { deviceId: client.data.deviceId })
        client.disconnect(true)
    }

    /** Ends one connection's hub subscription and closes its device's presence. */
    private async release(id: string): Promise<void> {
        const stream = this.streams.get(id)
        if (stream === undefined) return
        this.streams.delete(id)
        await stream.iterator.return?.()
        const deviceId = stream.client.data.deviceId
        if (deviceId !== undefined) await this.devices.presence(deviceId, false)
    }
}
