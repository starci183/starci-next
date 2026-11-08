import { learnersOf } from "../../fixtures/builders/identity.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** The stable code a refused door or GraphQL operation carries. */
interface Refusal {
    readonly code: string
}

/** What a GraphQL operation answers. */
interface GraphqlReply<T = Readonly<Record<string, unknown>>> {
    readonly data: T | null
    readonly errors?: ReadonlyArray<{ readonly extensions: Refusal }>
}

/** The device list as the relayDevices query answers it. */
interface DevicesData {
    readonly relayDevices: ReadonlyArray<{ readonly id: string; readonly online: boolean }>
}

/** The stable code of the first refusal of a reply, or undefined for a success. */
const codeOf = (reply: GraphqlReply<unknown>): string | undefined => reply.errors?.[0]?.extensions.code

/** The device-start answer. */
interface Pairing {
    readonly deviceCode: string
    readonly userCode: string
    readonly verifyUrl: string
    readonly expiresAt: string
}

const PREVIEW = `query ($input: RelayUserCodeInput!) { relayPairing(input: $input) { name platform expiresAt } }`
const CONFIRM = `mutation ($input: RelayUserCodeInput!) { confirmRelayDevice(input: $input) { id name platform online } }`
const DEVICES = `query { relayDevices { id name platform online lastSeenAt } }`
const REVOKE = `mutation ($input: RevokeRelayDeviceInput!) { revokeRelayDevice(input: $input) { id } }`

/**
 * The relay pairing doors of the real core app (contract.relay.channel, fr.relay.pair-device): the CLI starts a pairing
 * without a session, the signed-in learner previews and confirms the short code, the CLI takes its token once, the
 * device is listed, and once revoked it is gone. Errors carry the stable relay codes.
 */
describe("relay devices (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("e4")

    beforeEach(() => doors().reset())

    const ask = async (cookie: string, query: string, variables?: unknown): Promise<GraphqlReply> =>
        (await doors().post<GraphqlReply>("/graphql", { query, variables }, cookie === "" ? {} : { cookie })).body
    const devicesOf = async (cookie: string): Promise<GraphqlReply<DevicesData>> =>
        (await doors().post<GraphqlReply<DevicesData>>("/graphql", { query: DEVICES }, { cookie })).body
    const start = async (deviceName = "Minh laptop"): Promise<Pairing> =>
        (await doors().post<Pairing>("/api/relay/devices/start", { deviceName, platform: "linux" })).body
    const token = (deviceCode: string) =>
        doors().post<Refusal & { deviceToken: string }>("/api/relay/devices/token", { deviceCode })

    it("relay/pair-device: start, preview, confirm, take the token once, list, then revoke", async () => {
        const cookie = await doors().signIn(nextLearner())
        const pairing = await start()

        const pending = await token(pairing.deviceCode)
        const preview = await ask(cookie, PREVIEW, { input: { userCode: pairing.userCode.toLowerCase() } })
        const confirmed = await ask(cookie, CONFIRM, { input: { userCode: pairing.userCode } })
        const issued = await token(pairing.deviceCode)
        const again = await token(pairing.deviceCode)
        const listed = await devicesOf(cookie)

        expect(pairing.userCode).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/u)
        expect(pairing.verifyUrl).toMatch(/\/devices$/u)
        expect([pending.status, pending.body.code]).toEqual([409, "RELAY_PENDING"])
        expect(preview.data).toEqual({
            relayPairing: { name: "Minh laptop", platform: "linux", expiresAt: pairing.expiresAt },
        })
        expect(confirmed.data).toMatchObject({ confirmRelayDevice: { name: "Minh laptop", platform: "linux" } })
        expect(issued.status).toBe(200)
        expect(issued.body.deviceToken).toMatch(/^[A-Za-z0-9_-]{43}$/u)
        expect([again.status, again.body.code]).toEqual([404, "RELAY_CODE_NOT_FOUND"])
        const devices = listed.data?.relayDevices ?? []
        expect(devices).toHaveLength(1)
        expect(devices[0]?.online).toBe(false)

        const revoked = await ask(cookie, REVOKE, { input: { id: devices[0]?.id } })
        const twice = await ask(cookie, REVOKE, { input: { id: devices[0]?.id } })
        const after = await ask(cookie, DEVICES)

        expect(revoked.data).toEqual({ revokeRelayDevice: { id: devices[0]?.id } })
        expect(codeOf(twice)).toBe("RELAY_DEVICE_NOT_FOUND")
        expect(after.data).toEqual({ relayDevices: [] })
    })

    it("relay/device-limit: a free learner pairs one device; a second confirm is refused, a foreign code is not found", async () => {
        const cookie = await doors().signIn(nextLearner())
        const first = await start("Desktop")
        const second = await start("Laptop")

        await ask(cookie, CONFIRM, { input: { userCode: first.userCode } })
        const refused = await ask(cookie, CONFIRM, { input: { userCode: second.userCode } })
        const unknown = await ask(cookie, CONFIRM, { input: { userCode: "ZZZZ-ZZZZ" } })
        const bad = await doors().post<Refusal>("/api/relay/devices/start", { deviceName: "x", platform: "beos" })

        expect(codeOf(refused)).toBe("RELAY_DEVICE_LIMIT")
        expect(codeOf(unknown)).toBe("RELAY_CODE_NOT_FOUND")
        expect([bad.status, bad.body.code]).toEqual([400, "RELAY_PAIRING_INVALID"])
    })

    it("relay/session-required: the learner doors need a session", async () => {
        const pairing = await start()

        const preview = await ask("", PREVIEW, { input: { userCode: pairing.userCode } })
        const listed = await ask("", DEVICES)

        expect([codeOf(preview), codeOf(listed)]).toEqual(["IDENTITY_SESSION_REQUIRED", "IDENTITY_SESSION_REQUIRED"])
    })
})
