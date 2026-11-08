import { TestWorldError, TestWorldErrorCode, type HttpResponse, type TestApi, type WorldMail } from "@starci/test-world"
import type { EntityManager } from "typeorm"
import { sql } from "@modules/platform/database"
import type { ChallengeBody, Learner, SocialStartBody } from "../fixtures/builders/identity.builder"
import { oidcIssuerClientOf, type OidcIssuerClient } from "./fakes/oidc-issuer/oidc-issuer.client"
import { ALLOWED_ORIGIN } from "./test-apps.options"

interface CountRow {
    readonly n: number
}

/** The booted core app of a world. */
interface CoreHandle {
    readonly api: TestApi
}

/** The apps a world booted. */
interface WorldApps {
    readonly core?: CoreHandle | undefined
}

/** The databases a world runs. */
interface WorldDatabases {
    readonly primary?: EntityManager | undefined
}

/** The fakes a world runs. */
interface WorldFakes {
    readonly idp?: Parameters<typeof oidcIssuerClientOf>[0]
}

/** What the doors need of a booted world: the core app, the primary database, the issuer fake and the mail sink. */
export interface DoorsWorld {
    readonly apps: WorldApps
    readonly db: WorldDatabases
    readonly fake: WorldFakes
    readonly mail: WorldMail
}

/** The claims a social ID token carries beyond its subject and roles. */
interface SocialClaims {
    /** The email the provider asserts. */
    readonly email?: string
}

/** The `name=value` pair of the cookie called `name` in a joined Set-Cookie header. */
const cookiePair = (setCookie: string | undefined, name: string): string =>
    (setCookie ?? "")
        .split(/, (?=__Host-)/u)
        .find((cookie) => cookie.startsWith(`${name}=`))
        ?.split(";")[0] ?? ""

/** Extra request headers. */
type Headers = Readonly<Record<string, string>>

/** The handle a spec drives the identity doors with. */
export interface IdentityDoors {
    /** The identity provider fake. */
    readonly idp: OidcIssuerClient
    /** POSTs a body from the allowed origin, plus any extra headers. */
    post<T>(path: string, body?: unknown, headers?: Headers): Promise<HttpResponse<T>>
    /** GETs a path with optional headers. */
    get<T>(path: string, headers?: Headers): Promise<HttpResponse<T>>
    /** The six-digit code of the latest mail sent to an address. */
    codeSentTo(email: string): Promise<string>
    /** Clears the rate windows and the mailbox so a test starts fresh. */
    reset(): Promise<void>
    /** The number of unrevoked sessions. */
    activeSessions(): Promise<number>
    /** Seeds a learner into the provider realm. */
    seed(learner: Learner): Promise<string>
    /** Signs the learner in over the doors and answers the session cookie pair `name=value`. */
    signIn(learner: Learner): Promise<string>
    /** Signs in through the social code flow with the claims the provider's ID token carries and answers the session cookie pair. */
    signInSocial(provider: string, claims?: SocialClaims): Promise<string>
}

const RATE_WINDOWS = sql`DELETE FROM http_security_rate_windows`
const ACTIVE_SESSIONS = sql`SELECT count(*)::int AS n FROM identity_sessions WHERE revoked_at IS NULL`

const undeclared = (detail: string): Promise<never> =>
    Promise.reject(new TestWorldError({ code: TestWorldErrorCode.NotDeclared, params: { detail } }))

/** Drives the identity doors of the booted core app, the provider fake and the mail sink; a world that boots no core app answers every call with a rejection naming it. */
export const identityDoors = (world: DoorsWorld): IdentityDoors => {
    const core = world.apps.core
    const database = world.db.primary
    const coreApi = (): Promise<TestApi> =>
        core === undefined ? undeclared("the world boots no core app") : Promise.resolve(core.api)
    const primary = (): Promise<EntityManager> =>
        database === undefined ? undeclared("the world runs no primary database") : Promise.resolve(database)
    const idp = oidcIssuerClientOf(world.fake.idp)
    const mailbox = world.mail
    const post = async <T>(path: string, body?: unknown, headers: Headers = {}) =>
        (await coreApi()).post<T>(path, body, { headers: { origin: ALLOWED_ORIGIN, ...headers } })
    const codeSentTo = async (email: string): Promise<string> => {
        const mail = await mailbox.waitFor(email)
        return /\b(\d{6})\b/u.exec(mail.text)?.[1] ?? ""
    }
    const seed = (learner: Learner) => idp.seedUser({ ...learner, roles: ["member"] })
    return {
        idp,
        post,
        get: async <T>(path: string, headers: Headers = {}) => (await coreApi()).get<T>(path, { headers }),
        codeSentTo,
        reset: async () => {
            await (await primary()).query(RATE_WINDOWS)
            await mailbox.clear()
        },
        activeSessions: async () => (await (await primary()).query<Array<CountRow>>(ACTIVE_SESSIONS))[0]?.n ?? 0,
        seed,
        signInSocial: async (provider, claims = {}) => {
            const started = await post<SocialStartBody>("/api/identity/social/start", { provider })
            const authorizationUrl = started.body.authorizationUrl
            const redirect = new URL(
                await idp.authorize(authorizationUrl, { sub: `social-${provider}`, roles: ["member"], ...claims }),
            )
            const binding = cookiePair(started.headers["set-cookie"], "__Host-identity_social")
            const exchanged = await post(
                "/api/identity/social/exchange",
                {
                    code: redirect.searchParams.get("code") ?? "",
                    state: redirect.searchParams.get("state") ?? "",
                },
                { cookie: binding },
            )
            return cookiePair(exchanged.headers["set-cookie"], "__Host-identity_session")
        },
        signIn: async (learner) => {
            await seed(learner)
            const opened = await post<ChallengeBody>("/api/identity/sign-in", {
                identifier: learner.username,
                password: learner.password,
            })
            const code = await codeSentTo(learner.email)
            const verified = await post("/api/identity/sign-in/verify", { challenge: opened.body.challenge, code })
            return (verified.headers["set-cookie"] ?? "").split(";")[0] ?? ""
        },
    }
}
