import { learnersOf, type RefusalBody } from "../../fixtures/builders/learner.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

interface RolesBody {
    readonly data?: { readonly viewerRoles?: ReadonlyArray<string> } | null
    readonly errors?: ReadonlyArray<{ readonly extensions?: { readonly code?: string; readonly kind?: string } }>
}

const ROLES = { query: "{ viewerRoles }" }
const GRANT_ROLE = `UPDATE auth.users SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"roles":["REVIEWER"]}'::jsonb WHERE id = $1`
const DISABLE = `UPDATE auth.users SET banned_until = now() + interval '1 day' WHERE id = $1`

/**
 * identity guards: the real guard chain of the core app. Default deny holds: a public door is admitted without a token, a
 * protected door with no, a forged or a wrong-scheme bearer is refused, a signed-in learner reads the roles of the account
 * afresh on every request, and a disabled account is refused even with a token that is still valid.
 */
describe("identity guards (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a8")
    const roles = (authorization?: string) =>
        doors().post<RolesBody>("/graphql", ROLES, authorization === undefined ? {} : { authorization })

    beforeEach(() => doors().reset())

    it("admits a door that states a public reason without a token", async () => {
        const health = await doors().get("/health/live")

        expect(health.status).toBe(200)
    })

    it.each([[undefined], ["Bearer forged.token.value"], ["Basic dXNlcjpwYXNz"]])(
        "refuses a protected door carrying %s",
        async (authorization) => {
            const answer = await roles(authorization)

            expect(answer.body.data ?? null).toBeNull()
            expect(answer.body.errors?.[0]?.extensions).toMatchObject({
                code: "IDENTITY_UNAUTHENTICATED",
                kind: "unauthenticated",
            })
        },
    )

    it("answers the roles of the account afresh on every request", async () => {
        const signedIn = await doors().signInSession(nextLearner())
        const before = await roles(signedIn.bearer)
        await world.db.primary?.query(GRANT_ROLE, [signedIn.subject])
        const after = await roles(signedIn.bearer)

        expect(before.body.data?.viewerRoles).toEqual([])
        expect(after.body.data?.viewerRoles).toEqual(["REVIEWER"])
    })

    it("refuses a disabled account even with an access token that is still valid", async () => {
        const signedIn = await doors().signInSession(nextLearner())
        await world.db.primary?.query(DISABLE, [signedIn.subject])

        const answer = await roles(signedIn.bearer)
        const refused = await doors().post<RefusalBody>("/auth/login", { email: "x@starci.test", password: "x" })

        expect(answer.body.errors?.[0]?.extensions).toMatchObject({
            code: "IDENTITY_ACCOUNT_DISABLED",
            kind: "forbidden",
        })
        expect(refused.status).toBe(401)
    })
})
