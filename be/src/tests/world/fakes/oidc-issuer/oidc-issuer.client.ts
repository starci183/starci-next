import { isRecord, pkceChallenge, randomReference } from "@starci/auth/oidc"
import { FakeOidcIssuer, type FakeTokenClaims, type FakeUser } from "@starci/auth/testing"
import { TestWorldError, TestWorldErrorCode } from "@starci/test-world"
import {
    defineHttpFake,
    type FakeBridge,
    type FakeClient,
    type FakeDefinition,
    type FakeHttpReply,
    type FakeHttpRequest,
    type HttpFakeContext,
} from "@starci/test-world/fakes"

/** The client registration the issuer fake answers for; the app under test registers the same id. */
export const OIDC_FAKE_CLIENT_ID = "starci-next-integration"
const REALM = "test"

/** The issuer address of a fake served at `url`. */
export const oidcIssuerOf = (url: string): string => `${url}/realms/${REALM}`

interface IssuerState {
    issuer: Promise<FakeOidcIssuer> | undefined
}

type IssuerContext = HttpFakeContext<IssuerState, undefined>

const issuerOf = (context: IssuerContext): Promise<FakeOidcIssuer> => {
    context.state.issuer ??= FakeOidcIssuer.create({
        realm: REALM,
        origin: context.url,
        clientId: OIDC_FAKE_CLIENT_ID,
        clientSecret: context.secret("oidc-client"),
        identityProviders: ["facebook", "github"],
    })
    return context.state.issuer
}

/** One PKCE and nonce transaction, as the identity capability opens it. */
export interface OidcTransaction {
    readonly state: string
    readonly nonce: string
    readonly verifier: string
    readonly challenge: string
}

/** The handle of a spec: play the browser of the code flow, and steer the realm's accounts and refresh tokens. */
export interface OidcIssuerClient extends FakeClient {
    /** Plays the browser: answers the redirect address the provider would send for the authorization address. */
    authorize(authorizationUrl: string, claims?: FakeTokenClaims): Promise<string>
    /** Adds an account the password grant admits and the admin API lists; answers its id. */
    seedUser(user: OidcFakeUser): Promise<string>
    /** Ends every refresh token the realm holds, as their lifetime running out would: the next refresh is refused. */
    expireRefreshTokens(): Promise<void>
    /** The `kc_idp_hint` of every authorization address played so far. */
    idpHints(): Promise<ReadonlyArray<string>>
    /** True when the account's current password is this one. */
    passwordMatches(identifier: string, password: string): Promise<boolean>
}

/** An account a spec seeds into the fake realm. */
export type OidcFakeUser = FakeUser & { readonly password: string }

const userOf = (body: unknown): OidcFakeUser => {
    const record = isRecord(body) ? body : {}
    return {
        ...record,
        username: typeof record.username === "string" ? record.username : "",
        password: typeof record.password === "string" ? record.password : "",
    }
}

const isClaims = (value: unknown): value is FakeTokenClaims => isRecord(value)

const claimsOf = (body: unknown): FakeTokenClaims | undefined =>
    isRecord(body) && isClaims(body.claims) ? body.claims : undefined

const methodOf = (method: string): "GET" | "POST" | "PUT" => (method === "POST" || method === "PUT" ? method : "GET")

const payloadOf = (request: FakeHttpRequest): { body: unknown } | { form: Record<string, string> } | undefined => {
    if (request.method === "GET") return undefined
    const body = request.json()
    return body === undefined ? { form: Object.fromEntries(request.form()) } : { body }
}

const serve = async (request: FakeHttpRequest, context: IssuerContext): Promise<FakeHttpReply> => {
    const issuer = await issuerOf(context)
    const reply = await issuer.serve({
        method: methodOf(request.method),
        url: `${context.url}${request.path}`,
        timeoutMs: 2000,
        headers: request.headers,
        ...payloadOf(request),
    })
    return {
        status: reply.status,
        body: reply.body,
        ...(reply.location === undefined ? {} : { headers: { location: reply.location } }),
    }
}

/** Narrows the handle a world publishes for the `idp` fake to the issuer's own methods. */
const isOidcIssuerClient = (client: FakeClient | undefined): client is OidcIssuerClient =>
    client !== undefined && "authorize" in client

const undeclared = (): Promise<never> =>
    Promise.reject(
        new TestWorldError({
            code: TestWorldErrorCode.NotDeclared,
            params: { detail: "the world declares no oidc issuer fake" },
        }),
    )

/** The handle of the issuer fake; a world that declares none answers a handle whose every call rejects as not declared. */
export const oidcIssuerClientOf = (client: FakeClient | undefined): OidcIssuerClient =>
    isOidcIssuerClient(client)
        ? client
        : {
              failNext: undeclared,
              requests: undeclared,
              reset: undeclared,
              authorize: undeclared,
              seedUser: undeclared,
              expireRefreshTokens: undeclared,
              idpHints: undeclared,
              passwordMatches: undeclared,
          }

/** A transaction a spec opens for the code flow: random state, nonce and verifier, and the S256 challenge of the verifier. */
export const openOidcTransaction = (): OidcTransaction => {
    const verifier = randomReference()
    return { state: randomReference(), nonce: randomReference(), verifier, challenge: pkceChallenge(verifier) }
}

/** The OIDC issuer fake: the issuer package's realm (discovery, JWKS, every grant, revocation, the admin users API) over HTTPS, steered from the spec; the app trusts its run CA. */
export const oidcIssuerFake: (options?: undefined) => FakeDefinition<OidcIssuerClient> = defineHttpFake<
    OidcIssuerClient,
    undefined,
    IssuerState
>({
    https: true,
    state: () => ({ issuer: undefined }),
    routes: [{ method: "*", path: "/*", handle: serve }],
    values: (context) => ({ clientSecret: context.secret("oidc-client") }),
    controlActions: {
        authorize: async (body, context) =>
            (await issuerOf(context)).authorize(isRecord(body) ? String(body.url) : "", claimsOf(body)),
        seedUser: async (body, context) => (await issuerOf(context)).seedUser(userOf(body)).id,
        expireRefreshTokens: async (_body, context) => (await issuerOf(context)).revokeRefreshTokens(),
        idpHints: async (_body, context) => (await issuerOf(context)).idpHints,
        passwordMatches: async (body, context) =>
            isRecord(body) && (await issuerOf(context)).passwordMatches(String(body.identifier), String(body.password)),
    },
    client: (bridge: FakeBridge, base: FakeClient): OidcIssuerClient => ({
        ...base,
        authorize: (url, claims) => bridge.call<string>("authorize", { url, claims }),
        seedUser: (user) => bridge.call<string>("seedUser", user),
        expireRefreshTokens: () => bridge.call<void>("expireRefreshTokens", {}),
        idpHints: () => bridge.call<ReadonlyArray<string>>("idpHints", {}),
        passwordMatches: (identifier, password) => bridge.call<boolean>("passwordMatches", { identifier, password }),
    }),
})
