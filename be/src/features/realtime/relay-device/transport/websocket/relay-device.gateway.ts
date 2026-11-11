import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets"
import { relayDeviceTopic, type RelayFrame } from "@modules/domain/relay"
import type { Principal } from "@modules/platform/cqrs"
import { InjectRealtimeHub, type RealtimeHub } from "@modules/platform/realtime"
import type { RelayDeviceNamespace } from "./relay-device-websocket.module"

/** socket.io pings every 20 s and closes a connection silent for 40 s more, so a dead device is gone within a minute. */
@WebSocketGateway({ namespace: "/device", transports: ["websocket"], pingInterval: 20_000, pingTimeout: 40_000 })
/** The push-only relay door of a paired device: its module authenticates the device token before opening its stream. */
export class RelayDeviceGateway {
    /** The namespace created by the app's socket.io adapter; the module installs authentication before the app listens. */
    @WebSocketServer()
    namespace!: RelayDeviceNamespace

    constructor(@InjectRealtimeHub() private readonly hub: RealtimeHub) {}

    /** The device's frames inside its learner's prefix, after the last frame id the device took. */
    frames(principal: Principal, deviceId: string, after: string | undefined): AsyncIterable<RelayFrame> {
        return this.hub.subscribe(relayDeviceTopic(principal.id, deviceId), { after })
    }
}
