import { statSync } from "node:fs"
import { readConfig } from "./device-settings.adapter"
import { deviceKeyPathOf, readDeviceKey } from "./lab-files.adapter"
import { publicKeyOf } from "./lab-sign.policy"
import { pairCommand } from "./pairing.cli"
import type { CliIo, FetchInit } from "./relay-client.contracts"
import { lessonBody, worldOf } from "./lesson.testing"

const TOKEN = "k".repeat(43)

interface Call {
    readonly url: string
    readonly init: FetchInit
    readonly body: { query: string; variables: Record<string, unknown> }
}

/** A machine whose StarCi answers each GraphQL call with the next of `answers`. */
const machineOf = (answers: ReadonlyArray<unknown>) => {
    const world = worldOf(lessonBody())
    const calls: Array<Call> = []
    const io: CliIo = {
        ...world.io,
        fetch: (url, init) => {
            calls.push({ url, init, body: JSON.parse(init.body) as Call["body"] })
            const answer = answers[Math.min(calls.length - 1, answers.length - 1)]
            return Promise.resolve({ status: 200, text: JSON.stringify(answer) })
        },
    }
    return { world, io, calls }
}

const CLAIMED = { data: { claimRelayPairCode: { deviceToken: TOKEN } } }
const REGISTERED = { data: { registerRelayDeviceKey: true } }

describe("pairCommand", () => {
    it("claims the code without a bearer, stores the token and registers the public key of a new device key", async () => {
        const { world, io, calls } = machineOf([CLAIMED, REGISTERED])

        expect(await pairCommand(io, " ABCD-EFGH ")).toBe(0)

        expect(calls[0]?.url).toBe("https://app.test/graphql")
        expect(calls[0]?.init.headers.authorization).toBeUndefined()
        expect(calls[0]?.init.headers.origin).toBe("https://app.test")
        expect(calls[0]?.body.variables).toEqual({ code: "ABCD-EFGH", deviceName: "laptop", platform: "linux" })
        expect(readConfig(world.io.env)).toEqual({ baseUrl: "https://app.test", deviceToken: TOKEN })

        expect(calls[1]?.init.headers.authorization).toBe(`Bearer ${TOKEN}`)
        const privatePem = readDeviceKey(world.io.env) as string
        expect(calls[1]?.body.variables).toEqual({ publicKey: publicKeyOf(privatePem) })
        if (process.platform !== "win32") expect(statSync(deviceKeyPathOf(world.io.env)).mode & 0o777).toBe(0o600)
    })

    it("never prints the device token or the private key", async () => {
        const { world, io } = machineOf([CLAIMED, REGISTERED])

        await pairCommand(io, "ABCD-EFGH")

        const printed = [...world.out, ...world.err].join("\n")
        expect(printed).not.toContain(TOKEN)
        expect(printed).not.toContain("PRIVATE KEY")
        expect(printed).not.toContain(readDeviceKey(world.io.env) as string)
    })

    it("refuses a code that is not letters, digits and dashes before it calls StarCi", async () => {
        const { world, io, calls } = machineOf([CLAIMED])

        expect(await pairCommand(io, "ab cd; rm")).toBe(1)

        expect(calls).toHaveLength(0)
        expect(world.err[0]).toContain("pair code")
    })

    it("reports a refused code with its stable code and stores nothing", async () => {
        const { world, io } = machineOf([{ errors: [{ message: "no", extensions: { code: "RELAY_CODE_NOT_FOUND" } }] }])

        expect(await pairCommand(io, "ABCD-EFGH")).toBe(1)

        expect(world.err[0]).toContain("RELAY_CODE_NOT_FOUND")
        expect(readConfig(world.io.env).deviceToken).toBe("t".repeat(43))
        expect(readDeviceKey(world.io.env)).toBeNull()
    })

    it("keeps the token and says the machine cannot grade when the key is refused", async () => {
        const { world, io } = machineOf([
            CLAIMED,
            { errors: [{ message: "no", extensions: { code: "RELAY_DEVICE_KEY_INVALID" } }] },
        ])

        expect(await pairCommand(io, "ABCD-EFGH")).toBe(0)

        expect(readConfig(world.io.env).deviceToken).toBe(TOKEN)
        expect(world.err.join("\n")).toContain("cannot grade labs")
    })

    it("treats an answer without a token as a failure", async () => {
        const { world, io } = machineOf([{ data: { claimRelayPairCode: {} } }])

        expect(await pairCommand(io, "ABCD-EFGH")).toBe(1)
        expect(world.err[0]).toContain("without a device token")
    })
})
