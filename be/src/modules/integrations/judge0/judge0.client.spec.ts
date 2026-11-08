import { Test } from "@nestjs/testing"
import { FakeClock, mock } from "@starci/jest-preset"
import { CLOCK } from "@modules/platform/clock"
import { Secret } from "@modules/platform/config"
import { HTTP_CLIENT } from "@modules/platform/http"
import type { HttpClient, HttpResponse } from "@modules/platform/http"
import { LOGGER } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { TIMER } from "@modules/platform/retry"
import type { Timer } from "@modules/platform/retry"
import { Judge0Error, Judge0ErrorCode } from "./errors/judge0.error"
import { Judge0Client } from "./judge0.client"
import type { Judge0RunRequest } from "./judge0.contracts"
import { JUDGE0_OPTIONS } from "./judge0.decorators"
import { Judge0LogEvent } from "./judge0.log-events"
import type { Judge0Options } from "./judge0.options"

const NOW = new Date("2026-11-08T10:00:00.000Z")
const TOKEN = "spec-judge0-token"
const b64 = (text: string): string => Buffer.from(text, "utf8").toString("base64")

const endpoint = (overrides: Partial<Judge0Options> = {}): Judge0Options => ({
    baseUrl: "https://judge.example.test",
    authToken: new Secret(TOKEN),
    timeoutMs: 1000,
    pollIntervalMs: 100,
    deadlineMs: 250,
    ...overrides,
})

const request = (count = 2): Judge0RunRequest => ({
    correlationId: "c-1",
    language: "python",
    source: "print(1)",
    cases: Array.from({ length: count }, (_unused, index) => ({ stdin: `${index}`, expectedOutput: `${index}` })),
    cpuTimeLimitMs: 2000,
    memoryLimitKb: 262144,
})

const reply = (body: unknown, status = 201): HttpResponse => ({ status, body })
const created = (count: number): HttpResponse =>
    reply(Array.from({ length: count }, (_unused, index) => ({ token: `t${index}` })))
const judged = (statusId: number, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    status: { id: statusId },
    stdout: b64("ok"),
    time: "0.01",
    memory: 100,
    ...extra,
})
const read = (...entries: Array<Record<string, unknown>>): HttpResponse => reply({ submissions: entries }, 200)

interface Built {
    readonly client: Judge0Client
    readonly http: jest.Mocked<HttpClient>
    readonly logger: Logger
    readonly clock: FakeClock
    readonly timer: jest.Mocked<Timer>
}

const build = async (options: Judge0Options | null): Promise<Built> => {
    const http = mock<HttpClient>()
    const logger = mock<Logger>()
    const clock = new FakeClock(NOW)
    const timer = mock<Timer>()
    timer.schedule.mockImplementation((callback) => {
        clock.advance(100)
        callback()
        return () => undefined
    })
    const moduleRef = await Test.createTestingModule({
        providers: [
            Judge0Client,
            { provide: JUDGE0_OPTIONS, useValue: { judge0: options } },
            { provide: HTTP_CLIENT, useValue: http },
            { provide: CLOCK, useValue: clock },
            { provide: TIMER, useValue: timer },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { client: moduleRef.get(Judge0Client), http, logger, clock, timer }
}

describe("Judge0Client run", () => {
    it("creates one base64 batch, reads it back and answers one result per test in order", async () => {
        const { client, http } = await build(endpoint())
        http.request.mockResolvedValueOnce(created(2)).mockResolvedValueOnce(read(judged(3), judged(4)))

        const results = await client.run(request())

        expect(results.map((result) => result.status)).toEqual(["accepted", "wrong-answer"])
        expect(results[0]).toMatchObject({ stdout: "ok", timeMs: 10, memoryKb: 100 })
        const [create, poll] = http.request.mock.calls.map(([call]) => call)
        expect(create).toMatchObject({
            method: "POST",
            url: "https://judge.example.test/submissions/batch?base64_encoded=true",
            headers: { "X-Auth-Token": TOKEN },
            timeoutMs: 1000,
            correlationId: "c-1",
        })
        expect(JSON.stringify(create?.body)).toContain(b64("print(1)"))
        expect(poll).toMatchObject({ method: "GET" })
        expect(poll?.url).toContain("tokens=t0,t1")
        expect(poll).not.toHaveProperty("body")
    })

    it("polls again after the interval while a submission is still queued or processing", async () => {
        const { client, http, timer } = await build(endpoint())
        http.request
            .mockResolvedValueOnce(created(1))
            .mockResolvedValueOnce(read({ status: { id: 1 } }))
            .mockResolvedValueOnce(read({ status: { id: 2 } }))
            .mockResolvedValueOnce(read(judged(3)))

        const results = await client.run(request(1))

        expect(results).toHaveLength(1)
        expect(http.request).toHaveBeenCalledTimes(4)
        expect(timer.schedule).toHaveBeenCalledTimes(2)
        expect(timer.schedule).toHaveBeenCalledWith(expect.any(Function), 100)
    })

    it("splits more than twenty tests into batches of twenty", async () => {
        const { client, http } = await build(endpoint())
        http.request
            .mockResolvedValueOnce(created(20))
            .mockResolvedValueOnce(read(...Array.from({ length: 20 }, () => judged(3))))
            .mockResolvedValueOnce(created(1))
            .mockResolvedValueOnce(read(judged(5)))

        const results = await client.run(request(21))

        expect(results).toHaveLength(21)
        expect(results[20]?.status).toBe("time-limit")
    })
})

describe("Judge0Client run refusals", () => {
    it("fails with JUDGE0_UNAVAILABLE when the batch is still judging at the deadline", async () => {
        const { client, http, logger } = await build(endpoint({ deadlineMs: 250 }))
        http.request.mockResolvedValueOnce(created(1)).mockResolvedValue(read({ status: { id: 2 } }))

        await expect(client.run(request(1))).rejects.toMatchObject({ code: Judge0ErrorCode.Unavailable })

        expect(logger.warn).toHaveBeenCalledWith(Judge0LogEvent.CallFailed, { code: Judge0ErrorCode.Unavailable })
    })

    it("fails with JUDGE0_UNAVAILABLE when the connection is lost, keeping the cause for the log", async () => {
        const { client, http, logger } = await build(endpoint())
        const cause = new Error("econnreset")
        http.request.mockRejectedValueOnce(cause)

        await expect(client.run(request())).rejects.toMatchObject({ code: Judge0ErrorCode.Unavailable, cause })

        expect(logger.error).toHaveBeenCalledWith(Judge0LogEvent.CallFailed, cause, {
            code: Judge0ErrorCode.Unavailable,
        })
    })

    it("fails with JUDGE0_UNAVAILABLE on a server error and JUDGE0_REJECTED on a refusal", async () => {
        const { client, http, logger } = await build(endpoint())
        http.request.mockResolvedValueOnce(reply({}, 503)).mockResolvedValueOnce(reply({}, 401))

        await expect(client.run(request())).rejects.toMatchObject({ code: Judge0ErrorCode.Unavailable })
        await expect(client.run(request())).rejects.toMatchObject({ code: Judge0ErrorCode.Rejected })

        expect(logger.warn).toHaveBeenCalledWith(Judge0LogEvent.CallFailed, {
            code: Judge0ErrorCode.Rejected,
            status: 401,
        })
    })

    it("fails with JUDGE0_REJECTED when the create answer is not one token per test", async () => {
        const { client, http } = await build(endpoint())
        http.request.mockResolvedValueOnce(reply([{ token: "only-one" }]))

        await expect(client.run(request())).rejects.toMatchObject({ code: Judge0ErrorCode.Rejected })
    })

    it("fails with JUDGE0_REJECTED when the read answer is not a batch of that size or holds a non-submission", async () => {
        const { client, http } = await build(endpoint())
        http.request
            .mockResolvedValueOnce(created(1))
            .mockResolvedValueOnce(reply({ submissions: [] }, 200))
            .mockResolvedValueOnce(created(1))
            .mockResolvedValueOnce(reply({ submissions: ["x"] }, 200))

        await expect(client.run(request(1))).rejects.toMatchObject({ code: Judge0ErrorCode.Rejected })
        await expect(client.run(request(1))).rejects.toMatchObject({ code: Judge0ErrorCode.Rejected })
    })

    it("refuses with JUDGE0_NOT_CONFIGURED when it was built without an endpoint", async () => {
        const { client, http } = await build(null)

        await expect(client.run(request())).rejects.toBeInstanceOf(Judge0Error)

        expect(http.request).not.toHaveBeenCalled()
    })
})
