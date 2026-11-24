import { io } from "socket.io-client"
import type { DeviceConnection, DeviceHandlers } from "./relay-client.contracts"

/** The longest the socket waits between two attempts to get back after a cut. */
const RECONNECT_MAX_MS = 30_000

/** Connect errors that mean the device is no longer allowed in; retrying cannot help. */
const REFUSED = /REVOKED|UNAUTHORI[SZ]ED|FORBIDDEN/iu

/**
 * Opens the push-only device socket of the relay (namespace `/device`, websocket, the device token in the handshake) and hands
 * every frame to the handler. It sends nothing but the handshake: the relay never reads an event from a device. After a cut it
 * reconnects and resumes after the last frame id it took, so a run request is neither lost nor repeated.
 */
export const openDeviceSocket = (baseUrl: string, deviceToken: string, handlers: DeviceHandlers): DeviceConnection => {
    let after: string | undefined
    let finish: (reason: string) => void = () => undefined
    const ended = new Promise<string>((resolve) => {
        finish = resolve
    })
    const socket = io(`${baseUrl}/device`, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelayMax: RECONNECT_MAX_MS,
        auth: (give) => give({ deviceToken, ...(after === undefined ? {} : { after }) }),
    })
    socket.on("relay", (frame: unknown) => {
        const id =
            typeof frame === "object" && frame !== null && "id" in frame ? (frame as { id: unknown }).id : undefined
        if (typeof id === "string" && !id.startsWith("hello:") && !id.startsWith("bye:")) after = id
        handlers.onFrame(frame)
    })
    socket.on("connect", () => handlers.onStatus("connected"))
    socket.on("disconnect", (reason) => {
        handlers.onStatus(`disconnected (${reason}); reconnecting`)
        // socket.io does not retry a disconnect the server asked for; a relay restart must not leave the learner listening to nothing.
        if (reason === "io server disconnect") socket.connect()
    })
    socket.on("connect_error", (error) => {
        if (REFUSED.test(error.message)) {
            socket.close()
            finish(`StarCi refused this device (${error.message}). Run starci-relay login again.`)
            return
        }
        handlers.onStatus(`cannot connect (${error.message}); retrying`)
    })
    return {
        ended,
        close: () => {
            socket.close()
            finish("closed")
        },
    }
}
