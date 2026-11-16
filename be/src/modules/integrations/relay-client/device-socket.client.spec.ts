import { createServer, type Server as HttpServer } from "node:http"
import type { AddressInfo } from "node:net"
import { Server } from "socket.io"
import { openDeviceSocket } from "./device-socket.client"

/** A relay stand-in: the `/device` namespace of the real server library, authenticating by the handshake's device token. */
const relay = async (): Promise<{
    io: Server
    http: HttpServer
    url: string
    auths: Array<Record<string, unknown>>
}> => {
    const http = createServer()
    const io = new Server(http, { transports: ["websocket"] })
    const auths: Array<Record<string, unknown>> = []
    io.of("/device").use((client, next) => {
        auths.push({ ...client.handshake.auth })
        next(client.handshake.auth.deviceToken === "good" ? undefined : new Error("RELAY_DEVICE_REVOKED"))
    })
    await new Promise<void>((resolve) => http.listen(0, "127.0.0.1", resolve))
    return { io, http, url: `http://127.0.0.1:${(http.address() as AddressInfo).port}`, auths }
}

const until = async (holds: () => boolean): Promise<void> => {
    for (let waited = 0; !holds() && waited < 5000; waited += 20)
        await new Promise((resolve) => setTimeout(resolve, 20))
    expect(holds()).toBe(true)
}

describe("openDeviceSocket", () => {
    it("hands over the pushed frames, sending only the device token, and resumes after the last frame id on a reconnect", async () => {
        const world = await relay()
        const frames: Array<unknown> = []
        const status: Array<string> = []
        const connection = openDeviceSocket(world.url, "good", {
            onFrame: (f) => frames.push(f),
            onStatus: (s) => status.push(s),
        })
        try {
            await until(() => status.includes("connected"))
            const device = world.io.of("/device")
            device.emit("relay", { id: "hello:s1", type: "hello", deviceId: "d-1" })
            device.emit("relay", { id: "manifest:m-1", type: "manifest" })
            await until(() => frames.length === 2)
            expect(world.auths[0]).toEqual({ deviceToken: "good" })

            device.disconnectSockets(true)
            await until(() => world.auths.length === 2)
            expect(world.auths[1]).toEqual({ deviceToken: "good", after: "manifest:m-1" })
        } finally {
            connection.close()
            await connection.ended
            world.io.close()
        }
    })

    it("ends for good with a line when StarCi refuses the device token", async () => {
        const world = await relay()
        const connection = openDeviceSocket(world.url, "revoked", {
            onFrame: () => undefined,
            onStatus: () => undefined,
        })
        try {
            await expect(connection.ended).resolves.toContain("refused this device")
        } finally {
            connection.close()
            world.io.close()
        }
    })
})
