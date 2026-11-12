import { RelayRefusalCode } from "@modules/integrations/relay-client"
import { learnersOf } from "../../fixtures/builders/identity.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { RelayClientHolder, relayClientModules } from "../../world/relay-client-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** The code the CLI prints for the learner to type on the web. */
const USER_CODE_LINE = /enter the code: (\S+)/u

const CONFIRM = `mutation ($input: RelayUserCodeInput!) { confirmRelayDevice(input: $input) { id online } }`

/** A reply of the token door: the stable code of a refusal or the token. */
interface TokenBody {
    readonly code?: string
    readonly deviceToken?: string
}

/**
 * relay-client (integration): the learner CLI's client against the real core app of the world (the relay doors of
 * contract.relay.channel). It proves the login prints the pairing code, waits while the door answers RELAY_PENDING, stores the
 * device token once the learner confirmed on the web, and refuses without a crash while core is down.
 */
describe("relay-client (integration)", () => {
    const world = useTestWorld({ modules: relayClientModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const client = () => world.resolve(RelayClientHolder).client
    const nextLearner = learnersOf("d4")

    let printed: Array<string> = []
    let failed: Array<string> = []
    let exitCode: typeof process.exitCode
    beforeEach(async () => {
        await doors().reset()
        printed = []
        failed = []
        exitCode = process.exitCode
        jest.spyOn(process.stdout, "write").mockImplementation((chunk) => {
            printed.push(String(chunk))
            return true
        })
        jest.spyOn(process.stderr, "write").mockImplementation((chunk) => {
            failed.push(String(chunk))
            return true
        })
    })
    afterEach(() => {
        jest.restoreAllMocks()
        process.exitCode = exitCode
    })

    it("relay-client/login: prints the code, waits while pending, stores the token once the learner confirmed", async () => {
        const login = client().login()
        const line = await world.waitUntil(
            "pairing code printed",
            () => Promise.resolve(USER_CODE_LINE.exec(printed.join(""))),
            (match) => match !== null,
        )
        const userCode = line?.[1] ?? ""
        const cookie = await doors().signIn(nextLearner())
        const confirmed = await doors().post<{ readonly errors?: ReadonlyArray<unknown> }>(
            "/graphql",
            { query: CONFIRM, variables: { input: { userCode } } },
            { cookie },
        )
        await login

        expect(confirmed.body.errors).toBeUndefined()
        expect(printed.join("")).toContain("This machine is connected to StarCi.")
        expect(process.exitCode).toBe(0)
    })

    it("relay-client/pending: the token door answers the code the client waits on until the learner confirms", async () => {
        const started = await doors().post<{ readonly deviceCode: string }>("/api/relay/devices/start", {
            deviceName: "Laptop",
            platform: "linux",
        })

        const polled = await doors().post<TokenBody>("/api/relay/devices/token", {
            deviceCode: started.body.deviceCode,
        })

        expect(polled.body.code).toBe(RelayRefusalCode.Pending)
    })

    it("relay-client/outage: refuses with a line, not a crash, while core is down", async () => {
        await world.apps.core?.during(() => client().login())

        expect(failed.join("")).toContain("StarCi could not be reached.")
        expect(process.exitCode).toBe(1)
    })
})
