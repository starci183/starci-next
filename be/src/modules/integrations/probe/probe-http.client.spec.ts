import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { TIMER, type Timer } from "@modules/platform/retry"
import { ProbeError, ProbeErrorCode } from "./errors/probe.error"
import type { ProbeSendRequest } from "./probe.contracts"
import { ProbeHttpClient } from "./probe-http.client"
import { HTTP_WIRE, type HttpWire, type WireAddress, type WireRequest, type WireResponse } from "@modules/platform/http"

const REQUEST: ProbeSendRequest = {
    method: "POST",
    url: "http://app.example.com/orders",
    headers: { accept: "application/json" },
    body: '{"a":"b"}',
    timeoutMs: 1000,
    maxBytes: 10,
}

const build = async () => {
    const cancel = jest.fn()
    const timer = mock<Timer>()
    timer.schedule.mockReturnValue(cancel)
    const abort = jest.fn()
    const outgoing = mock<WireRequest>({ abort })
    const wire = mock<HttpWire>()
    wire.open.mockReturnValue(outgoing)
    const moduleRef = await Test.createTestingModule({
        providers: [ProbeHttpClient, { provide: TIMER, useValue: timer }, { provide: HTTP_WIRE, useValue: wire }],
    }).compile()
    return { client: moduleRef.get(ProbeHttpClient), timer, cancel, abort, wire }
}

/** The arguments the client opened the wire with, once `send` ran. */
const openedWith = (wire: ReturnType<typeof mock<HttpWire>>) => {
    const [url, options, body, call] = wire.open.mock.calls[0] ?? []
    return { url, options, body, call }
}

const responseOf = (status: number, headers: WireResponse["headers"]) => mock<WireResponse>({ status, headers })

/** The callback the client registered on a response with a registrar, which is a mock that kept its first call. */
const callbackOf = <T extends (...args: Array<never>) => void>(
    registrar: jest.MockedFunction<(callback: T) => void>,
): T => {
    const [callback] = registrar.mock.calls[0] ?? []
    if (callback === undefined) throw new ProbeError({ code: ProbeErrorCode.TargetRefused })
    return callback
}

describe("ProbeHttpClient send", () => {
    it("opens the wire with the guarded lookup and answers the status, the flat headers and the body", async () => {
        const { client, cancel, timer, wire } = await build()

        const pending = client.send(REQUEST)
        const { url, options, body, call } = openedWith(wire)
        const response = responseOf(201, { "x-request-id": "abc", "set-cookie": ["a=1", "b=2"], skipped: undefined })
        call?.onResponse(response)
        callbackOf(response.onData)(Buffer.from("he"))
        callbackOf(response.onData)(Buffer.from("llo"))
        callbackOf(response.onEnd)()

        await expect(pending).resolves.toEqual({
            ok: true,
            status: 201,
            headers: { "x-request-id": "abc", "set-cookie": "a=1, b=2" },
            body: "hello",
        })
        expect(url?.href).toBe("http://app.example.com/orders")
        expect(options).toMatchObject({
            method: "POST",
            headers: { accept: "application/json", "user-agent": "StarCi-Probe/1", "content-length": "9" },
        })
        expect(body).toBe('{"a":"b"}')
        expect(timer.schedule).toHaveBeenCalledWith(expect.any(Function), 1000)
        expect(cancel).toHaveBeenCalledTimes(1)
    })

    it("sends no content length without a body", async () => {
        const { client, wire } = await build()

        const pending = client.send({ ...REQUEST, url: "https://app.example.com/", body: null })
        const { options, body, call } = openedWith(wire)
        const response = responseOf(200, {})
        call?.onResponse(response)
        callbackOf(response.onEnd)()

        await expect(pending).resolves.toMatchObject({ ok: true, status: 200, body: "" })
        expect(options?.headers).not.toHaveProperty("content-length")
        expect(body).toBeNull()
    })

    it("gives up on a body over the byte cap and ignores what comes after", async () => {
        const { client, wire } = await build()

        const pending = client.send(REQUEST)
        const response = responseOf(200, {})
        openedWith(wire).call?.onResponse(response)
        callbackOf(response.onData)(Buffer.alloc(11))
        callbackOf(response.onEnd)()

        await expect(pending).resolves.toEqual({ ok: false, error: "too-large" })
        expect(response.destroy).toHaveBeenCalledTimes(1)
    })

    it("answers network when the response breaks", async () => {
        const { client, wire } = await build()

        const pending = client.send(REQUEST)
        const response = responseOf(200, {})
        openedWith(wire).call?.onResponse(response)
        callbackOf(response.onError)()

        await expect(pending).resolves.toEqual({ ok: false, error: "network" })
    })
})

describe("ProbeHttpClient send (part 2)", () => {
    it("answers network when the wire fails before it returns", async () => {
        const { client, wire } = await build()
        wire.open.mockImplementation((_url, _options, _body, call) => {
            call.onError(new TypeError("EAI_AGAIN"))
            return mock<WireRequest>()
        })

        await expect(client.send(REQUEST)).resolves.toEqual({ ok: false, error: "network" })
    })

    it("answers timeout and aborts the request when the deadline passes", async () => {
        const { client, timer, abort } = await build()

        const pending = client.send(REQUEST)
        timer.schedule.mock.calls[0]?.[0]()

        await expect(pending).resolves.toEqual({ ok: false, error: "timeout" })
        expect(abort).toHaveBeenCalledTimes(1)
    })

    it("answers target-refused for a name that resolves inside and network for any other failure", async () => {
        const refused = await build()
        const first = refused.client.send(REQUEST)
        openedWith(refused.wire).call?.onError(new ProbeError({ code: ProbeErrorCode.TargetRefused }))
        const broken = await build()
        const second = broken.client.send(REQUEST)
        openedWith(broken.wire).call?.onError(new TypeError("ECONNREFUSED"))

        await expect(first).resolves.toEqual({ ok: false, error: "target-refused" })
        await expect(second).resolves.toEqual({ ok: false, error: "network" })
    })
})

describe("ProbeHttpClient guarded lookup", () => {
    const PUBLIC: WireAddress = { address: "93.184.216.34", family: 4 }

    /** Runs the lookup the client handed the wire for a name that resolves to the addresses, or fails. */
    const lookedUp = async (resolved: ReadonlyArray<WireAddress> | Error, all: boolean) => {
        const { client, wire } = await build()
        if (resolved instanceof Error) wire.resolve.mockRejectedValue(resolved)
        else wire.resolve.mockResolvedValue(resolved)
        void client.send(REQUEST)
        const lookup = openedWith(wire).options?.lookup
        return new Promise<ReadonlyArray<unknown>>((done) => {
            lookup?.("app.example.com", { all }, (...args: ReadonlyArray<unknown>) => done(args))
        })
    }

    it("connects to a public address, as a list when the socket asks for all of them", async () => {
        await expect(lookedUp([PUBLIC], false)).resolves.toEqual([null, "93.184.216.34", 4])
        await expect(lookedUp([PUBLIC], true)).resolves.toEqual([null, [PUBLIC]])
    })

    it("refuses a name when any address it resolves to is not public, or when it resolves to none", async () => {
        const mixed = await lookedUp([PUBLIC, { address: "10.0.0.1", family: 4 }], false)
        const none = await lookedUp([], false)

        for (const answer of [mixed, none]) {
            expect(answer[0]).toBeInstanceOf(ProbeError)
            expect(answer[0]).toMatchObject({ code: "PROBE_TARGET_REFUSED" })
        }
    })

    it("passes a resolver failure on", async () => {
        const failure = new TypeError("ENOTFOUND")

        await expect(lookedUp(failure, false)).resolves.toEqual([failure, "", 0])
    })
})

describe("ProbeHttpClient isPublicHost", () => {
    it("is true only for a name that resolves to public addresses alone", async () => {
        const { client, wire } = await build()
        wire.resolve.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
        wire.resolve.mockResolvedValueOnce([
            { address: "93.184.216.34", family: 4 },
            { address: "127.0.0.1", family: 4 },
        ])
        wire.resolve.mockResolvedValueOnce([])
        wire.resolve.mockRejectedValueOnce(new TypeError("ENOTFOUND"))

        await expect(client.isPublicHost("a.example.com")).resolves.toBe(true)
        await expect(client.isPublicHost("127.0.0.1.nip.io")).resolves.toBe(false)
        await expect(client.isPublicHost("none.example.com")).resolves.toBe(false)
        await expect(client.isPublicHost("gone.example.com")).resolves.toBe(false)
    })
})
