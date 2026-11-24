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
const REGISTERED = { data: { registerRelayDeviceKey: { registered: true } } }

describe("pairCommand", () => {
    it("claims the six-digit code through the schema's input without a bearer, stores the token and registers the public key of a new device key", async () => {
        const { world, io, calls } = machineOf([CLAIMED, REGISTERED])

        expect(await pairCommand(io, " 123 456 ")).toBe(0)

        expect(calls[0]?.url).toBe("https://app.test/graphql")
        expect(calls[0]?.init.headers.authorization).toBeUndefined()
        expect(calls[0]?.init.headers.origin).toBe("https://app.test")
        expect(calls[0]?.body.query).toContain("claimRelayPairCode(input: $input) { deviceToken }")
        expect(calls[0]?.body.variables).toEqual({
            input: { code: "123456", deviceName: "laptop", platform: "linux" },
        })
        expect(readConfig(world.io.env)).toEqual({ baseUrl: "https://app.test", deviceToken: TOKEN })

        expect(calls[1]?.init.headers.authorization).toBe(`Bearer ${TOKEN}`)
        const privatePem = readDeviceKey(world.io.env) as string
        expect(calls[1]?.body.query).toContain("registerRelayDeviceKey(input: $input) { registered }")
        expect(calls[1]?.body.variables).toEqual({ input: { publicKey: publicKeyOf(privatePem) } })
        if (process.platform !== "win32") expect(statSync(deviceKeyPathOf(world.io.env)).mode & 0o777).toBe(0o600)
    })

    it("never prints the device token or the private key", async () => {
        const { world, io } = machineOf([CLAIMED, REGISTERED])

        await pairCommand(io, "123456")

        const printed = [...world.out, ...world.err].join("\n")
        expect(printed).not.toContain(TOKEN)
        expect(printed).not.toContain("PRIVATE KEY")
        expect(printed).not.toContain(readDeviceKey(world.io.env) as string)
    })

    it.each(["ABCD-EFGH", "12345", "1234567", "ab cd; rm", ""])(
        "refuses %p, which is not six digits, before it calls StarCi, in Vietnamese and English",
        async (typed) => {
            const { world, io, calls } = machineOf([CLAIMED])

            expect(await pairCommand(io, typed)).toBe(1)

            expect(calls).toHaveLength(0)
            expect(world.err[0]).toContain("6 chữ số")
            expect(world.err[1]).toContain("six digits")
        },
    )

    it("takes a code typed with a dash or spaces between its digits", async () => {
        const { io, calls } = machineOf([CLAIMED, REGISTERED])

        expect(await pairCommand(io, "123-456")).toBe(0)

        expect(calls[0]?.body.variables).toMatchObject({ input: { code: "123456" } })
    })

    it("reports a refused code with its stable code and stores nothing", async () => {
        const { world, io } = machineOf([{ errors: [{ message: "no", extensions: { code: "RELAY_CODE_NOT_FOUND" } }] }])

        expect(await pairCommand(io, "123456")).toBe(1)

        expect(world.err[0]).toContain("RELAY_CODE_NOT_FOUND")
        expect(readConfig(world.io.env).deviceToken).toBe("t".repeat(43))
        expect(readDeviceKey(world.io.env)).toBeNull()
    })

    it("keeps the token and says the machine cannot grade when the key is refused", async () => {
        const { world, io } = machineOf([
            CLAIMED,
            { errors: [{ message: "no", extensions: { code: "RELAY_DEVICE_KEY_INVALID" } }] },
        ])

        expect(await pairCommand(io, "123456")).toBe(0)

        expect(readConfig(world.io.env).deviceToken).toBe(TOKEN)
        expect(world.err.join("\n")).toContain("cannot grade labs")
    })

    it("says the machine cannot grade when StarCi answers without confirming the key", async () => {
        const { world, io } = machineOf([CLAIMED, { data: { registerRelayDeviceKey: { registered: false } } }])

        expect(await pairCommand(io, "123456")).toBe(0)

        expect(world.err.join("\n")).toContain("did not confirm the device key")
    })

    it("treats an answer without a token as a failure", async () => {
        const { world, io } = machineOf([{ data: { claimRelayPairCode: {} } }])

        expect(await pairCommand(io, "123456")).toBe(1)
        expect(world.err[0]).toContain("without a device token")
    })
})
