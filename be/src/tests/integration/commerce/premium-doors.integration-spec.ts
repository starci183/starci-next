import { persistPendingPurchase } from "../../fixtures/builders/commerce.builder"
import { learnersOf, type SessionBody } from "../../fixtures/builders/identity.builder"
import { PURCHASE_ID_BY_ORDER } from "../../fixtures/persistence/commerce-purchase.sql"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** The stable code and kind a refused GraphQL operation carries. */
interface RefusalExtensions {
    readonly code: string
    readonly kind: string
}

/** One refused operation as the GraphQL formatter answers it. */
interface GraphqlRefusal {
    readonly extensions: RefusalExtensions
}

/** What a GraphQL operation answers: the data of a success or the refusals of a failure. */
interface GraphqlReply {
    readonly data: Readonly<Record<string, Readonly<Record<string, unknown>> | null>> | null
    readonly errors?: ReadonlyArray<GraphqlRefusal>
}

const START = `mutation ($input: StartPremiumCheckoutInput!) { startPremiumCheckout(input: $input) { orderId rail } }`
const ORDER = `query ($input: PremiumOrderInput!) { premiumOrder(input: $input) { orderId status plan amountVnd premiumUntil } }`
const MINE = `query { myPremium { isPremium premiumUntil lastRail } }`
const UNKNOWN_ORDER = "30000000-0000-4000-8000-0000000000ff"

/** The refusal an operation answered, or undefined for a success. */
const refusalOf = (reply: GraphqlReply): RefusalExtensions | undefined => reply.errors?.[0]?.extensions

/**
 * The Premium doors of the real core app over a signed-in session: every door needs the session, a learner reads only
 * their own order, and a plan or rail no offer carries is refused with its stable code.
 */
describe("premium doors (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("c7")

    beforeEach(() => doors().reset())

    const ask = async (cookie: string, query: string, variables?: unknown): Promise<GraphqlReply> =>
        (await doors().post<GraphqlReply>("/graphql", { query, variables }, cookie === "" ? {} : { cookie })).body
    const subjectOf = async (cookie: string): Promise<string> =>
        (await doors().get<SessionBody>("/api/identity/session", { cookie })).body.identity.subject
    const orderIdOf = async (orderCode: string): Promise<string> => {
        const rows: Array<{ purchase_id: string }> =
            (await world.db.primary?.query(PURCHASE_ID_BY_ORDER, ["sepay", orderCode])) ?? []
        return rows[0]?.purchase_id ?? ""
    }

    it("commerce/session-required: every Premium door refuses a caller without a session", async () => {
        const start = await ask("", START, { input: { plan: "monthly" } })
        const order = await ask("", ORDER, { input: { orderId: UNKNOWN_ORDER } })
        const mine = await ask("", MINE)

        expect([start, order, mine].map((reply) => refusalOf(reply)?.code)).toEqual(
            Array(3).fill("IDENTITY_SESSION_REQUIRED"),
        )
    })

    it("commerce/own-order-through-the-door: a learner reads their own order and gets not-found for another's", async () => {
        const owner = await doors().signIn(nextLearner())
        const other = await doors().signIn(nextLearner())
        await persistPendingPurchase(world.db.primary, {
            learnerId: await subjectOf(owner),
            rail: "sepay",
            orderCode: "SE-DOOR-1",
        })
        const orderId = await orderIdOf("SE-DOOR-1")

        const own = await ask(owner, ORDER, { input: { orderId } })
        const foreign = await ask(other, ORDER, { input: { orderId } })

        expect(own.data?.premiumOrder).toMatchObject({ status: "verifying", amountVnd: 229_000 })
        expect(refusalOf(foreign)).toMatchObject({ code: "PURCHASE_ORDER_NOT_FOUND", kind: "not-found" })
    })

    it("commerce/names-refused-by-code: an unknown plan or rail is refused and a fresh learner is not Premium", async () => {
        const cookie = await doors().signIn(nextLearner())

        const plan = await ask(cookie, START, { input: { plan: "weekly" } })
        const rail = await ask(cookie, START, { input: { plan: "monthly", rail: "paypal" } })
        const mine = await ask(cookie, MINE)

        expect([refusalOf(plan)?.code, refusalOf(rail)?.code]).toEqual([
            "PURCHASE_PLAN_UNKNOWN",
            "PURCHASE_RAIL_UNKNOWN",
        ])
        expect(mine.data?.myPremium).toEqual({ isPremium: false, premiumUntil: null, lastRail: null })
    })
})
