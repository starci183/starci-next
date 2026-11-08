import { persistAgentLabUsage } from "../../fixtures/builders/agent-lab.builder"
import { learnersOf, type SessionBody } from "../../fixtures/builders/identity.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

interface QuotaData {
    readonly limit: number
    readonly used: number
    readonly remaining: number
    readonly exhausted: boolean
    readonly resetsAt: string
}

interface QuotaBodyData {
    readonly agentQuota: QuotaData
}

interface QuotaBody {
    readonly data?: QuotaBodyData
    readonly errors?: ReadonlyArray<unknown>
}

interface RefusalBody {
    readonly errors?: ReadonlyArray<{ readonly extensions: object }>
}

const QUOTA_QUERY = `query AgentQuota { agentQuota { limit used remaining exhausted resetsAt } }`

/** Agent quota door (integration): `agentQuota` of the real core app counts per learner and UTC day. */
describe("agent quota door (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("c3")

    beforeEach(async () => {
        await doors().reset()
    })

    it("refuses a caller with no session", async () => {
        const answer = await doors().post<RefusalBody>("/graphql", { query: QUOTA_QUERY, variables: {} }, {})

        expect(answer.body.errors?.[0]?.extensions).toMatchObject({ code: "IDENTITY_SESSION_REQUIRED" })
    })

    it("answers the default quota of 50 calls for a learner who made none", async () => {
        const cookie = await doors().signIn(nextLearner())

        const answer = await doors().post<QuotaBody>("/graphql", { query: QUOTA_QUERY, variables: {} }, { cookie })

        expect(answer.body.errors).toBeUndefined()
        expect(answer.body.data?.agentQuota).toMatchObject({ limit: 50, used: 0, remaining: 50, exhausted: false })
        expect(new Date(answer.body.data?.agentQuota.resetsAt ?? "").toISOString()).toMatch(/T00:00:00\.000Z$/u)
    })

    it("counts the calls of the day and reaches the hard stop at the limit", async () => {
        const cookie = await doors().signIn(nextLearner())
        const session = await doors().get<SessionBody>("/api/identity/session", { cookie })
        await persistAgentLabUsage(world.db.primary, session.body.identity.subject, 50)

        const answer = await doors().post<QuotaBody>("/graphql", { query: QUOTA_QUERY, variables: {} }, { cookie })

        expect(answer.body.data?.agentQuota).toMatchObject({ limit: 50, used: 50, remaining: 0, exhausted: true })
    })
})
