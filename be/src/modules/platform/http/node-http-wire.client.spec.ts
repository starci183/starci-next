import { createServer, type Server } from "node:http"
import type { LookupFunction } from "node:net"
import { Test } from "@nestjs/testing"
import { NodeHttpWire } from "./node-http-wire.client"
import type { WireOptions } from "./http-wire.port"

/** Resolves every name to the loopback, so a local server stands for the learner's app. */
const toLoopback: LookupFunction = (_hostname, options, callback) => {
    if (options.all === true) callback(null, [{ address: "127.0.0.1", family: 4 }])
    else callback(null, "127.0.0.1", 4)
}

const OPTIONS: WireOptions = { method: "GET", headers: {}, lookup: toLoopback }

interface Local {
    readonly server: Server
    readonly port: number
}

const serve = (): Promise<Local> =>
    new Promise((resolve) => {
        const server = createServer((request, response) => {
            const chunks: Array<Buffer> = []
            request.on("data", (chunk: Buffer) => chunks.push(chunk))
            request.on("end", () => {
                response.writeHead(201, { "x-echo": request.method ?? "" })
                response.end(Buffer.concat(chunks).toString("utf8") || "empty")
            })
        })
        server.listen(0, "127.0.0.1", () => {
            const address = server.address()
            resolve({ server, port: typeof address === "object" && address !== null ? address.port : 0 })
        })
    })

const build = async (): Promise<NodeHttpWire> => {
    const moduleRef = await Test.createTestingModule({ providers: [NodeHttpWire] }).compile()
    return moduleRef.get(NodeHttpWire)
}

/** What a request answered: the status, the echo header and the body, or the failure. */
type Outcome = { readonly status: number; readonly echo: string; readonly body: string } | Error

const exchange = (wire: NodeHttpWire, url: string, options: WireOptions, body: string | null): Promise<Outcome> =>
    new Promise((resolve) => {
        wire.open(new URL(url), options, body, {
            onResponse: (response) => {
                const chunks: Array<Buffer> = []
                response.onData((chunk) => chunks.push(chunk))
                response.onError(() => resolve(new TypeError("body broke")))
                response.onEnd(() => {
                    response.destroy()
                    resolve({
                        status: response.status,
                        echo: String(response.headers["x-echo"]),
                        body: Buffer.concat(chunks).toString("utf8"),
                    })
                })
            },
            onError: resolve,
        })
    })

describe("NodeHttpWire open", () => {
    it("sends a request over http with the chosen lookup and reports the head and the body", async () => {
        const { server, port } = await serve()
        const wire = await build()

        const get = await exchange(wire, `http://probe.test:${port}/`, OPTIONS, null)
        const post = await exchange(wire, `http://probe.test:${port}/`, { ...OPTIONS, method: "POST" }, "hello")
        server.close()

        expect(get).toEqual({ status: 201, echo: "GET", body: "empty" })
        expect(post).toEqual({ status: 201, echo: "POST", body: "hello" })
    })

    it("reports a failed connection, over http and over https", async () => {
        const { server, port } = await serve()
        const wire = await build()

        const tls = await exchange(wire, `https://probe.test:${port}/`, OPTIONS, null)
        server.close()
        const closed = await exchange(wire, `http://probe.test:${port}/`, OPTIONS, null)

        expect(tls).toHaveProperty("message")
        expect(closed).toHaveProperty("message")
    })

    it("aborts a request in flight", async () => {
        const { server, port } = await serve()
        const wire = await build()

        const aborted = new Promise<Error | undefined>((resolve) => {
            const request = wire.open(new URL(`http://probe.test:${port}/`), OPTIONS, null, {
                onResponse: () => resolve(undefined),
                onError: resolve,
            })
            request.abort()
        })

        await expect(aborted).resolves.toHaveProperty("message")
        server.close()
    })
})

describe("NodeHttpWire resolve", () => {
    it("resolves a name to its addresses and rejects a name that does not exist", async () => {
        const wire = await build()

        const addresses = await wire.resolve("localhost")

        expect(addresses.length).toBeGreaterThan(0)
        expect(addresses.every((entry) => entry.address !== "" && (entry.family === 4 || entry.family === 6))).toBe(
            true,
        )
        await expect(wire.resolve("probe.invalid")).rejects.toHaveProperty("message")
    })
})
