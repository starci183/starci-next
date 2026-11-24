import { generateKeyPairSync, sign } from "node:crypto"
import { listenCommand, type ListenOptions } from "./listen.cli"
import { KEYS, REPORT_RED, lessonBody, pulled, uploads, worldOf, type World } from "./lesson.testing"
import type { CliIo, DeviceHandlers } from "./relay-client.contracts"

const NOW = 1_800_000_000_000
const COMMAND = "starci-relay run outbox --scenario dup-submit --guard idempotency-key=off"

/** A manifest frame as the relay pushes it, signed with `key`. */
const frameOf = (
    key = KEYS.privateKey,
    extra: Record<string, unknown> = {},
    command = COMMAND,
): { id: string; type: "manifest"; manifest: { payload: string; signature: string } } => {
    const payload = JSON.stringify({
        manifestId: "m-1",
        taskId: "lesson:outbox",
        learnerId: "l-1",
        deviceId: "d-1",
        issuedAt: new Date(NOW - 1000).toISOString(),
        checks: [{ id: "dup-submit", command, cwd: ".", timeoutMs: 600_000 }],
        ...extra,
    })
    const signature = sign(null, Buffer.from(payload, "utf8"), key).toString("base64")
    return { id: `manifest:${String(extra.manifestId ?? "m-1")}`, type: "manifest", manifest: { payload, signature } }
}

interface Listening {
    readonly world: World
    readonly questions: Array<string>
    /** Pushes frames, then ends the socket and waits for the command. */
    readonly pushed: (frames: ReadonlyArray<unknown>) => Promise<number>
    readonly listened: () => number
}

/** A learner machine whose device socket the spec drives by hand. */
const listening = (
    options: ListenOptions,
    machine: { isTty?: boolean; answer?: boolean; paired?: boolean } = {},
): Listening => {
    const world = worldOf(lessonBody(), () => ({ report: REPORT_RED, exitCode: 1 }))
    const root = pulled(world)
    const questions: Array<string> = []
    let handlers: DeviceHandlers | undefined
    let end: (reason: string) => void = () => undefined
    let opened = 0
    const io: CliIo = {
        ...world.io,
        now: () => NOW,
        isTty: () => machine.isTty ?? true,
        confirm: (question) => {
            questions.push(question)
            return Promise.resolve(machine.answer ?? true)
        },
        listen: (_url, _token, given) => {
            opened += 1
            handlers = given
            return { ended: new Promise<string>((resolve) => (end = resolve)), close: () => end("closed") }
        },
    }
    return {
        world,
        questions,
        listened: () => opened,
        pushed: async (frames) => {
            const running = listenCommand(io, options, root)
            frames.forEach((frame) => handlers?.onFrame(frame))
            end("closed")
            return running
        },
    }
}

const HELLO = { id: "hello:s1", type: "hello", deviceId: "d-1" }

describe("listenCommand", () => {
    it("asks with the lesson, scenario and guards, then runs it through the verified run path and uploads", async () => {
        const listen = listening({ autoConfirm: false })

        expect(await listen.pushed([HELLO, frameOf()])).toBe(0)

        expect(listen.questions).toHaveLength(1)
        expect(listen.questions[0]).toContain("lesson outbox")
        expect(listen.questions[0]).toContain("scenario dup-submit")
        expect(listen.questions[0]).toContain("guards off: idempotency-key")
        expect(listen.world.commands[0]).toMatchObject({
            command: "npm test -- --scenario dup-submit",
            env: { GUARD_IDEMPOTENCY_KEY: "off" },
        })
        expect(uploads(listen.world).find((upload) => upload.input.slot === "scenario")?.input).toMatchObject({
            scenarioId: "dup-submit",
            guardsOff: ["idempotency-key"],
        })
    })

    it("does not run when the learner says no", async () => {
        const listen = listening({ autoConfirm: false }, { answer: false })

        await listen.pushed([HELLO, frameOf()])

        expect(listen.world.commands).toHaveLength(0)
        expect(listen.world.out.join("\n")).toContain("Not run.")
    })

    it("refuses without a terminal unless --auto-confirm is given, and never opens the socket", async () => {
        const listen = listening({ autoConfirm: false }, { isTty: false })

        expect(await listen.pushed([HELLO, frameOf()])).toBe(1)

        expect(listen.world.err.join("\n")).toContain("--auto-confirm")
        expect(listen.listened()).toBe(0)
        expect(listen.world.commands).toHaveLength(0)
    })

    it("runs without a terminal and without a question when --auto-confirm is given", async () => {
        const listen = listening({ autoConfirm: true }, { isTty: false })

        expect(await listen.pushed([HELLO, frameOf()])).toBe(0)

        expect(listen.questions).toHaveLength(0)
        expect(listen.world.commands).toHaveLength(1)
    })

    it("ignores a manifest StarCi did not sign", async () => {
        const listen = listening({ autoConfirm: false })

        await listen.pushed([HELLO, frameOf(generateKeyPairSync("ed25519").privateKey)])

        expect(listen.world.commands).toHaveLength(0)
        expect(listen.questions).toHaveLength(0)
        expect(listen.world.err.join("\n")).toContain("did not sign")
    })

    it("ignores a request issued to another device and a command that is not a run", async () => {
        const listen = listening({ autoConfirm: false })

        await listen.pushed([
            HELLO,
            frameOf(KEYS.privateKey, { deviceId: "d-2", manifestId: "m-2" }),
            frameOf(KEYS.privateKey, { manifestId: "m-3" }, "rm -rf ~"),
        ])

        expect(listen.world.commands).toHaveLength(0)
        expect(listen.world.err.join("\n")).toContain("another device")
    })

    it("handles a manifest delivered twice once", async () => {
        const listen = listening({ autoConfirm: true })

        await listen.pushed([HELLO, frameOf(), frameOf()])

        expect(listen.world.commands).toHaveLength(1)
    })

    it("runs requests one after another", async () => {
        const listen = listening({ autoConfirm: true })

        await listen.pushed([
            HELLO,
            frameOf(KEYS.privateKey, { manifestId: "m-1" }),
            frameOf(KEYS.privateKey, { manifestId: "m-2" }),
        ])

        expect(listen.world.commands).toHaveLength(2)
    })

    it("ends with a failure when StarCi refuses the device", async () => {
        const world = worldOf(lessonBody())
        const io: CliIo = {
            ...world.io,
            listen: () => ({
                ended: Promise.resolve("StarCi refused this device (RELAY_DEVICE_REVOKED)."),
                close: () => undefined,
            }),
        }

        expect(await listenCommand(io, { autoConfirm: false }, world.cwd)).toBe(1)
        expect(world.err.join("\n")).toContain("refused this device")
    })
})
