import { SessionHttpService } from "@modules/domain/identity"
import { sql } from "@modules/platform/database"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

const STATE = "s".repeat(43)
const BINDING = "b".repeat(43)
const SESSION_REFERENCE = "r".repeat(43)
const LOGIN_DELETED =
    "__Host-identity_login=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
const SESSION_DELETED =
    "__Host-identity_session=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
const LOGIN_TRANSACTION_ROWS = sql`SELECT state_digest FROM identity_login_transactions`
const SESSION_ROWS = sql`SELECT reference_digest FROM identity_sessions`

interface DigestRow {
    readonly state_digest: string
}

/**
 * identity session: the real session lifecycle over the migrated primary database, with the provider edge a real
 * unreachable HTTPS endpoint. It proves every outcome that does not need a live provider: provider-unavailable start
 * persists no transaction, the callback consumes nothing and answers the fixed error redirect with exact cookie
 * attributes, session reads refuse absent and unknown credentials, sign-out clears the cookie while the provider
 * logout cannot be reached, and durable outage fails every path closed.
 */
describe("identity session (integration)", () => {
    const world = useTestWorld({ modules: identityModules })
    const sessions = (): SessionHttpService => world.resolve(SessionHttpService)

    it("refuses to open a transaction while the provider is unreachable and persists none", async () => {
        await expect(sessions().start()).rejects.toMatchObject({ code: "IDENTITY_PROVIDER_UNAVAILABLE" })
        await expect(world.db.primary.query<Array<DigestRow>>(LOGIN_TRANSACTION_ROWS)).resolves.toEqual([])
    })

    it("answers the fixed error redirect without a durable transaction and refuses a replay identically", async () => {
        const input = { state: STATE, binding: BINDING, code: "one-use-code" }

        const first = await sessions().callback(input)
        const second = await sessions().callback(input)

        expect(first).toEqual({
            url: "/sign-in?auth=error",
            cookies: [LOGIN_DELETED, SESSION_DELETED],
            cause: undefined,
        })
        expect(second).toEqual(first)
        await expect(world.db.primary.query<Array<DigestRow>>(SESSION_ROWS)).resolves.toEqual([])
    })

    it("answers the fixed error redirect and clears both cookies when durable state cannot answer the claim", async () => {
        await world.interruptDatabase(async () => {
            const result = await sessions().callback({ state: STATE, binding: BINDING, code: "one-use-code" })

            expect(result.url).toBe("/sign-in?auth=error")
            expect(result.cookies).toEqual([LOGIN_DELETED, SESSION_DELETED])
            expect(result.cause).toBeDefined()
        })
    })

    it.each([undefined, SESSION_REFERENCE])(
        "refuses an absent or unknown credential and clears the cookie",
        async (reference) => {
            await expect(sessions().current(reference)).resolves.toMatchObject({
                kind: "refused",
                code: "IDENTITY_SESSION_REQUIRED",
                cookies: [SESSION_DELETED],
            })
        },
    )

    it("fails the session read closed while the durable store is cut, still clearing the cookie", async () => {
        await world.interruptDatabase(async () => {
            await expect(sessions().current(SESSION_REFERENCE)).resolves.toMatchObject({
                kind: "refused",
                code: "IDENTITY_SESSION_UNAVAILABLE",
                cookies: [SESSION_DELETED],
            })
        })
    })

    it.each([undefined, SESSION_REFERENCE])(
        "clears the credential and answers the fixed signed-out return while provider logout is unreachable",
        async (reference) => {
            const result = await sessions().signOut(reference)

            expect(result).toMatchObject({
                kind: "ok",
                value: { url: "/sign-in?auth=error", cookies: [SESSION_DELETED] },
                cookies: [SESSION_DELETED],
            })
            expect(result.kind === "ok" ? result.value.cause : undefined).toBeDefined()
        },
    )

    it("still clears the credential when durable revocation cannot be confirmed", async () => {
        await world.interruptDatabase(async () => {
            await expect(sessions().signOut(SESSION_REFERENCE)).resolves.toMatchObject({
                kind: "refused",
                code: "IDENTITY_SESSION_UNAVAILABLE",
                cookies: [SESSION_DELETED],
            })
        })
    })
})
