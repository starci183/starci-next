import { generateKeyPairSync, sign } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { FakeClock, fakeIds, mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { CLOCK } from "@modules/platform/clock"
import { DomainError } from "@modules/platform/errors"
import { HTTP_CLIENT, type HttpClient } from "@modules/platform/http"
import { IDS } from "@modules/platform/ids"
import { TIMER, type Timer } from "@modules/platform/retry"
import { readQueue, writeQueue } from "./upload-queue.adapter"
import { isRecord, jsonOf } from "./json.mapper"
import { ManifestPolicy } from "./manifest.policy"
import { ProjectKitService } from "./project-kit.service"
import { RELAY_CLIENT_OPTIONS, RELAY_CORRELATION, RELAY_TERMINAL } from "./relay-client.decorators"
import type { CheckRun, PendingUpload, TerminalPort } from "./relay-client.contracts"
import { RelayClientService } from "./relay-client.service"

/** The reason a double of the HTTP port gives for a StarCi that cannot be reached. */
class DownError extends DomainError<"RELAY_CLIENT_TEST_DOWN"> {}

/** One request the fake StarCi saw: the door, the bearer and the parsed JSON body. */
interface Request {
    readonly url: string
    readonly authorization: string | undefined
    readonly origin: string | undefined
    readonly body: unknown
}

/** What a fake door answers: its status (0: not reachable) and its JSON body. */
interface Answer {
    readonly status: number
    readonly body: unknown
}

/** What a spec decides about its machine. */
interface Machine {
    /** Extra settings of the environment. */
    readonly env?: Readonly<Record<string, string>>
    /** Where the clock starts, in epoch milliseconds. */
    readonly startAt?: number
    /** What the learner answers when asked to confirm. */
    readonly confirms?: boolean
    /** What running a check answers. */
    readonly run?: CheckRun
    /** The project folder the machine works in. */
    readonly cwd?: string
}

const KEYS = generateKeyPairSync("ed25519")
const PUBLIC_PEM = KEYS.publicKey.export({ type: "spki", format: "pem" }).toString()
const TOKEN = "t".repeat(43)
const CHECK = { id: "test", command: "npm test", cwd: ".", timeoutMs: 600_000 }

/** A fake terminal, a fake StarCi, and the service built through Nest over them. */
const worldOf = async (door: (request: Request) => Answer, machine: Machine = {}) => {
    const home = mkdtempSync(join(tmpdir(), "starci-next-"))
    const env = { STARCI_NEXT_HOME: home, STARCI_NEXT_URL: "https://app.test", ...machine.env }
    const out: Array<string> = []
    const err: Array<string> = []
    const exits: Array<number> = []
    const requests: Array<Request> = []
    const http = mock<HttpClient>()
    http.request.mockImplementation((request) => {
        const read = jsonOf(Buffer.from(request.bytes ?? "").toString("utf8"))
        const seen = {
            url: request.url,
            authorization: request.headers?.authorization,
            origin: request.headers?.origin,
            body: read.kind === "read" ? read.value : null,
        }
        requests.push(seen)
        const answer = door(seen)
        if (answer.status === 0) throw new DownError({ code: "RELAY_CLIENT_TEST_DOWN" })
        const text = answer.body === null || answer.body === undefined ? "" : JSON.stringify(answer.body)
        return Promise.resolve({ status: answer.status, body: Buffer.from(text, "utf8") })
    })
    const clock = new FakeClock(machine.startAt ?? 0)
    const timer = mock<Timer>()
    timer.schedule.mockImplementation((callback, ms) => {
        clock.advance(ms)
        callback()
        return () => undefined
    })
    const terminal = mock<TerminalPort>()
    terminal.out.mockImplementation((line) => out.push(line))
    terminal.err.mockImplementation((line) => err.push(line))
    terminal.hostName.mockReturnValue("laptop-hv")
    terminal.platform.mockReturnValue("win32")
    terminal.exit.mockImplementation((code) => exits.push(code))
    terminal.confirm.mockResolvedValue(machine.confirms ?? true)
    terminal.runCommand.mockResolvedValue(machine.run ?? { exitCode: 0, output: "1 passed", durationMs: 42 })
    const moduleRef = await Test.createTestingModule({
        providers: [
            RelayClientService,
            ManifestPolicy,
            ProjectKitService,
            {
                provide: RELAY_CLIENT_OPTIONS,
                useValue: { env, ...(machine.cwd === undefined ? {} : { cwd: machine.cwd }) },
            },
            { provide: RELAY_TERMINAL, useValue: terminal },
            { provide: CLOCK, useValue: clock },
            { provide: IDS, useValue: fakeIds() },
            { provide: RELAY_CORRELATION, useValue: "00000000-0000-4000-8000-0000000000ff" },
            { provide: TIMER, useValue: timer },
            { provide: HTTP_CLIENT, useValue: http },
        ],
    }).compile()
    return { service: moduleRef.get(RelayClientService), home, env, out, err, exits, requests, terminal, http }
}

const started: Answer = {
    status: 200,
    body: {
        deviceCode: "d".repeat(43),
        userCode: "ABCD-EFGH",
        verifyUrl: "https://app.test/devices",
        expiresAt: new Date(10_000).toISOString(),
    },
}
const pending: Answer = { status: 409, body: { code: "RELAY_PENDING" } }
const replay = (answers: ReadonlyArray<Answer>) => {
    let index = 0
    return (): Answer => {
        const answer = answers[Math.min(index, answers.length - 1)] ?? { status: 503, body: null }
        index += 1
        return answer
    }
}

describe("RelayClientService login", () => {
    it("prints the code and the page, polls until confirmed, and stores the token readable by the user alone", async () => {
        const answers = [started, pending, { status: 200, body: { deviceToken: TOKEN } }]
        const world = await worldOf(replay(answers))

        await world.service.login()

        expect(world.requests[0]).toMatchObject({
            url: "https://app.test/api/relay/devices/start",
            origin: "https://app.test",
            body: { deviceName: "laptop-hv", platform: "windows" },
        })
        expect(world.requests.slice(1).map((request) => request.url)).toEqual(
            Array(2).fill("https://app.test/api/relay/devices/token"),
        )
        expect(world.out[0]).toBe("Open https://app.test/devices and enter the code: ABCD-EFGH")
        const file = join(world.home, "config.json")
        expect(jsonOf(readFileSync(file, "utf8"))).toEqual({
            kind: "read",
            value: { baseUrl: "https://app.test", deviceToken: TOKEN },
        })
        if (process.platform !== "win32") expect(statSync(file).mode & 0o777).toBe(0o600)
        expect(world.exits).toEqual([0])
    })

    it("stops on a refusal with its stable code", async () => {
        const world = await worldOf(replay([started, { status: 401, body: { code: "RELAY_DEVICE_REVOKED" } }]))

        await world.service.login()

        expect(world.err[0]).toContain("RELAY_DEVICE_REVOKED")
        expect(world.exits).toEqual([1])
    })

    it("gives up when the code lapses before it was confirmed", async () => {
        const world = await worldOf(replay([started, pending]))

        await world.service.login()

        expect(world.err[0]).toContain("RELAY_CODE_NOT_FOUND")
        expect(world.exits).toEqual([1])
    })

    it("reports a refused start, and an unreachable StarCi", async () => {
        const refused = await worldOf(replay([{ status: 400, body: { code: "RELAY_PAIRING_INVALID" } }]))
        await refused.service.login()
        expect(refused.err[0]).toBe("StarCi refused (RELAY_PAIRING_INVALID).")

        const down = await worldOf(replay([{ status: 0, body: null }]))
        await down.service.login()
        expect(down.err[0]).toBe("StarCi could not be reached.")

        const cut = await worldOf(replay([started, { status: 0, body: null }]))
        await cut.service.login()
        expect(cut.err[0]).toBe("StarCi could not be reached.")
        expect(cut.exits).toEqual([1])
    })

    it("names an unnamed machine my-machine, and reads an answer without a body as unavailable", async () => {
        const world = await worldOf(replay([{ status: 502, body: null }]))
        world.terminal.hostName.mockReturnValue("")

        await world.service.login()

        expect(world.requests[0]?.body).toEqual({ deviceName: "my-machine", platform: "windows" })
        expect(world.err[0]).toBe("StarCi refused (RELAY_UNAVAILABLE).")
    })
})

describe("RelayClientService an answer that is not bytes", () => {
    it("reads an answer whose body is not bytes as unavailable", async () => {
        const world = await worldOf(replay([started]))
        world.http.request.mockResolvedValue({ status: 200, body: "text" })

        await world.service.login()

        expect(world.err[0]).toBe("StarCi refused (RELAY_UNAVAILABLE).")
    })
})

describe("RelayClientService status, logout and devices", () => {
    it("tells whether the machine is paired and forgets the token on logout", async () => {
        const world = await worldOf(() => ({ status: 200, body: { deviceToken: TOKEN } }))
        writeFileSync(join(world.home, "config.json"), JSON.stringify({ baseUrl: "https://app.test" }))

        await world.service.status()
        writeFileSync(
            join(world.home, "config.json"),
            JSON.stringify({ baseUrl: "https://app.test", deviceToken: TOKEN }),
        )
        await world.service.status()
        await world.service.logout()
        await world.service.status()

        expect(world.out.filter((line) => line.startsWith("This machine is"))).toEqual([
            "This machine is not paired. Run starci-next login.",
            "This machine is paired.",
            "This machine is not paired. Run starci-next login.",
        ])
        expect(world.out).toContain("This machine forgot its token. Revoke it for good at https://app.test/devices.")
        expect(world.exits).toEqual([0, 0, 0, 0])
    })

    it("points at the devices page", async () => {
        const world = await worldOf(() => ({ status: 200, body: {} }))

        await world.service.devices()

        expect(world.out).toEqual(["Your paired devices: https://app.test/devices"])
    })

    it("names the platform the relay knows", async () => {
        const world = await worldOf(() => ({ status: 409, body: { code: "RELAY_PENDING" } }))
        const names: Array<unknown> = []
        for (const name of ["win32", "darwin", "linux", "freebsd"]) {
            world.terminal.platform.mockReturnValue(name)
            await world.service.login()
            const body = world.requests.at(-1)?.body
            names.push(isRecord(body) ? body.platform : undefined)
        }

        expect(names).toEqual(["windows", "macos", "linux", "linux"])
    })
})

/** One GraphQL operation the fake relay saw. */
interface Operation {
    readonly name: string
    readonly input: Record<string, unknown>
}

/** A signed manifest answer of the relay for `taskId`. */
const manifestAnswer = (taskId: string, checks: ReadonlyArray<unknown>): Answer => {
    const payload = JSON.stringify({ manifestId: "m-1", taskId, checks })
    const signature = sign(null, Buffer.from(payload, "utf8"), KEYS.privateKey).toString("base64")
    return { status: 200, body: { data: { relayManifest: { manifestId: "m-1", payload, signature } } } }
}

/** The mutation or query name of a GraphQL request, and its input. */
const operationOf = (request: Request): Operation => {
    const body = isRecord(request.body) ? request.body : {}
    const query = typeof body.query === "string" ? body.query : ""
    const variables = isRecord(body.variables) ? body.variables : {}
    return { name: /\{ (\w+)\(/u.exec(query)?.[1] ?? "", input: isRecord(variables.input) ? variables.input : {} }
}

/** A paired machine with a manifest key, and a fake relay: the manifest query answers `manifest`, uploads answer `uploads`. */
const pairedWorld = async (
    manifest: Answer,
    uploads: (name: string) => Answer = () => ({ status: 200, body: { data: {} } }),
    machine: Machine = {},
) => {
    const world = await worldOf(
        (request) => {
            expect(request.url).toBe("https://app.test/graphql")
            expect(request.authorization).toBe(`Bearer ${TOKEN}`)
            const operation = operationOf(request).name
            return operation === "relayManifest" ? manifest : uploads(operation)
        },
        { ...machine, env: { STARCI_NEXT_MANIFEST_KEY: PUBLIC_PEM, ...machine.env } },
    )
    writeFileSync(join(world.home, "config.json"), JSON.stringify({ baseUrl: "https://app.test", deviceToken: TOKEN }))
    return { ...world, operations: () => world.requests.map((request) => operationOf(request)) }
}

describe("RelayClientService run", () => {
    it("verifies the signed manifest, runs its check once confirmed, and uploads ack, started, log and result", async () => {
        const world = await pairedWorld(manifestAnswer("task-1", [CHECK]))

        await world.service.run(["task-1"], false)

        expect(world.operations().map((operation) => operation.name)).toEqual([
            "relayManifest",
            "relayManifestAck",
            "relayCheckStarted",
            "relayLog",
            "relayCheckResult",
        ])
        expect(world.operations()[4]?.input).toEqual({
            eventId: "00000000-0000-4000-8000-000000000005",
            taskId: "task-1",
            runId: "00000000-0000-4000-8000-000000000001",
            checkId: "test",
            passed: true,
            exitCode: 0,
            durationMs: 42,
            slot: "test",
            ref: "test",
        })
        expect(world.out).toContain("  test: npm test   (in ., at most 600s)")
        expect(world.out.at(-1)).toBe("Results sent to StarCi (practice).")
        expect(readQueue(world.env)).toEqual([])
        expect(world.exits).toEqual([0])
    })

    it("drops an upload StarCi refuses as malformed, since resending cannot fix it", async () => {
        const world = await pairedWorld(manifestAnswer("task-1", []), () => ({
            status: 200,
            body: { errors: [{ extensions: { code: "RELAY_PAYLOAD_INVALID" } }] },
        }))
        const stale: PendingUpload = { mutation: "relayLog", input: { eventId: "e-1" } }
        writeQueue(world.env, [stale])

        await world.service.run(["task-1"], true)

        expect(readQueue(world.env)).toEqual([])
        expect(world.exits).toEqual([0])
    })

    it("runs nothing when the learner declines", async () => {
        const world = await pairedWorld(manifestAnswer("task-1", [CHECK]), undefined, { confirms: false })

        await world.service.run(["task-1"], false)

        expect(world.out.at(-1)).toBe("Nothing was run.")
        expect(world.operations().map((operation) => operation.name)).toEqual(["relayManifest"])
        expect(world.terminal.runCommand).not.toHaveBeenCalled()
    })
})

describe("RelayClientService run uploads", () => {
    it("keeps unaccepted uploads under their event ids and resends them first on the next run", async () => {
        let isDown = true
        const failing = { exitCode: 1, output: "x", durationMs: 1 }
        const world = await pairedWorld(
            manifestAnswer("task-1", [CHECK]),
            (name) =>
                isDown && name === "relayLog"
                    ? { status: 200, body: { errors: [{ extensions: { code: "HTTP_SECURITY_RATE_LIMITED" } }] } }
                    : { status: 200, body: { data: {} } },
            { run: failing },
        )
        await world.service.run(["task-1"], true)
        const waiting = readQueue(world.env).map((upload) => upload.input.eventId)
        expect(waiting).toHaveLength(2)
        expect(world.out.at(-1)).toBe("2 upload(s) wait for the next run.")
        expect(world.exits).toEqual([1])

        isDown = false
        world.requests.length = 0
        await world.service.run(["task-1"], true)

        expect(
            world
                .operations()
                .slice(0, 2)
                .map((operation) => operation.input.eventId),
        ).toEqual(waiting)
        expect(readQueue(world.env)).toEqual([])
    })
})

describe("RelayClientService run refusals", () => {
    const forged: Answer = {
        status: 200,
        body: {
            data: {
                relayManifest: {
                    payload: JSON.stringify({ manifestId: "m", taskId: "task-1", checks: [] }),
                    signature: "AAAA",
                },
            },
        },
    }

    it.each([
        ["a manifest of another task", manifestAnswer("task-2", [CHECK])],
        ["a forged signature", forged],
        ["no manifest", { status: 200, body: { data: { relayManifest: null } } }],
    ])("runs nothing for %s", async (_name, manifest) => {
        const world = await pairedWorld(manifest)

        await world.service.run(["task-1"], true)

        expect(world.err).toEqual(["The task manifest is not signed by StarCi; nothing was run."])
        expect(world.exits).toEqual([1])
    })

    it("prints the relay's refusal of the manifest with its stable code", async () => {
        const world = await pairedWorld({
            status: 200,
            body: { errors: [{ extensions: { code: "LESSON_PREMIUM_REQUIRED" } }] },
        })

        await world.service.run(["task-1"], true)

        expect(world.err).toEqual(["StarCi refused (LESSON_PREMIUM_REQUIRED)."])
    })

    it("refuses to run without a pairing or a manifest key", async () => {
        const keyless = await pairedWorld(manifestAnswer("task-1", [CHECK]), undefined, {
            env: { STARCI_NEXT_MANIFEST_KEY: "" },
        })
        await keyless.service.run(["task-1"], true)
        expect(keyless.err[0]).toContain("STARCI_NEXT_MANIFEST_KEY")
        expect(keyless.requests).toEqual([])

        const unpaired = await worldOf(() => ({ status: 200, body: {} }))
        await unpaired.service.run(["task-1"], true)
        await unpaired.service.run([], true)
        expect(unpaired.err).toEqual([
            "This machine is not paired. Run starci-next login.",
            "This machine is not paired. Run starci-next login.",
        ])
        expect(unpaired.exits).toEqual([1, 1])
    })
})

describe("RelayClientService in a project folder", () => {
    it("runs a milestone of the project there, and copies the kit into it", async () => {
        const cwd = mkdtempSync(join(tmpdir(), "starci-project-"))
        mkdirSync(join(cwd, "starci"), { recursive: true })
        writeFileSync(join(cwd, "starci", "project.yaml"), 'project: "<project-id>"')
        const world = await worldOf(() => ({ status: 200, body: {} }), { cwd })

        await world.service.run(["bf-data-and-cache"], true)
        await world.service.init({ language: "ruby", force: false })

        expect(world.err[0]).toContain("starci-next login")
        expect(world.err[1]).toContain("Unknown language ruby")
        expect(world.exits).toEqual([1, 1])
    })
})
