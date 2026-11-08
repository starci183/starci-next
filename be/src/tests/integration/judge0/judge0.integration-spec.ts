import {
    JUDGE0_GATEWAY,
    Judge0ErrorCode,
    type Judge0Gateway,
    type Judge0RunRequest,
} from "@modules/integrations/judge0"
import { JUDGE0_FAKE_MARKERS } from "../../world/fakes/judge0/judge0.client"
import { judge0Modules } from "../../world/practice-world.options"
import { useTestWorld } from "../../world/use-test-world"

const requestOf = (source: string, cases = 2): Judge0RunRequest => ({
    correlationId: "corr-judge0",
    language: "python",
    source,
    cases: Array.from({ length: cases }, (_unused, index) => ({ stdin: `${index}`, expectedOutput: `${index}` })),
    cpuTimeLimitMs: 2000,
    memoryLimitKb: 262_144,
})

/**
 * judge0 (integration): the Judge0 client against the world's Judge0 fake. It proves the batch is created and read over the
 * wire with the auth token and base64 text, that a pending batch is polled until judged, that more than twenty tests go in
 * more than one batch, and that a refused token or an unreachable judge refuses as the coded Judge0ErrorCode.
 */
describe("judge0 (integration)", () => {
    const world = useTestWorld({ modules: judge0Modules })
    const judge = (): Judge0Gateway => world.resolve<Judge0Gateway>(JUDGE0_GATEWAY)

    beforeEach(async () => {
        await world.fake.judge0?.reset()
    })

    it("judges every test and sends the token and base64 source", async () => {
        const results = await judge().run(requestOf("print(1)"))

        const recorded = (await world.fake.judge0?.requests()) ?? []
        expect(results.map((result) => [result.status, result.stdout])).toEqual([
            ["accepted", "0"],
            ["accepted", "1"],
        ])
        expect(recorded[0]?.method).toBe("POST")
        expect(recorded[0]?.headers["x-auth-token"]).toBeTruthy()
        expect(recorded[0]?.body).toContain(Buffer.from("print(1)", "utf8").toString("base64"))
        expect(recorded[0]?.body).not.toContain("print(1)")
    })

    it("maps the statuses of a compile error and a time limit", async () => {
        const broken = await judge().run(requestOf(JUDGE0_FAKE_MARKERS.compileError, 1))
        const slow = await judge().run(requestOf(JUDGE0_FAKE_MARKERS.timeLimit, 1))

        expect(broken[0]).toMatchObject({ status: "compile-error", timeMs: null })
        expect(broken[0]?.compileOutput).toContain("expected")
        expect(slow[0]?.status).toBe("time-limit")
    })

    it("polls a batch that is still judging", async () => {
        const results = await judge().run(requestOf(JUDGE0_FAKE_MARKERS.slow, 1))

        const reads = ((await world.fake.judge0?.requests()) ?? []).filter((entry) => entry.method === "GET")
        expect(results[0]?.status).toBe("accepted")
        expect(reads.length).toBeGreaterThanOrEqual(3)
    })

    it("splits more than twenty tests over several batches and keeps their order", async () => {
        const results = await judge().run(requestOf("print(1)", 45))

        const creates = ((await world.fake.judge0?.requests()) ?? []).filter((entry) => entry.method === "POST")
        expect(results).toHaveLength(45)
        expect(results.map((result) => result.stdout)).toEqual(
            Array.from({ length: 45 }, (_unused, index) => `${index}`),
        )
        expect(creates).toHaveLength(3)
    })

    it("refuses with JUDGE0_UNAVAILABLE when the judge fails and JUDGE0_REJECTED when it refuses the token", async () => {
        await world.fake.judge0?.failNext({ status: 503, times: 1 })
        await expect(judge().run(requestOf("print(1)"))).rejects.toMatchObject({ code: Judge0ErrorCode.Unavailable })

        await world.fake.judge0?.failNext({ status: 401, times: 1 })
        await expect(judge().run(requestOf("print(1)"))).rejects.toMatchObject({ code: Judge0ErrorCode.Rejected })
    })
})
