import type { RefusalBody } from "../../fixtures/builders/identity.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

interface FailureExtensions {
    readonly code?: string
    readonly kind?: string
    readonly params?: object
}

interface FailureEntry {
    readonly message: string
    readonly extensions?: FailureExtensions
}

interface GraphqlFailureBody {
    readonly data?: unknown
    readonly errors?: ReadonlyArray<FailureEntry>
}

/** A refusal with the display text the common filter adds. */
interface TextRefusalBody extends RefusalBody {
    readonly message: string
}

const GRAPHQL = "/graphql"

/**
 * http error answers (integration): a rate-limited REST answer says when to come back, in the body and the Retry-After
 * header, and a malformed GraphQL operation is answered as the request-invalid code with no schema detail.
 */
describe("http error answers (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)

    beforeEach(() => doors().reset())

    it("answers a rate-limited REST caller with the seconds to wait, in the params and the Retry-After header", async () => {
        const results = await Promise.all(
            Array.from({ length: 31 }, () => doors().post<TextRefusalBody>("/api/identity/sign-in", {})),
        )
        const limited = results.find((result) => result.status === 429)
        const seconds = limited?.body.params.retryAfterSeconds

        expect(limited?.body.code).toBe("HTTP_SECURITY_RATE_LIMITED")
        expect(limited?.body.kind).toBe("rate-limited")
        expect(Number.isInteger(seconds)).toBe(true)
        expect(seconds).toBeGreaterThan(0)
        expect(Number(limited?.headers["retry-after"])).toBe(seconds)
        expect(limited?.body.message).toContain(String(seconds))
    })

    it.each([
        ["an unknown field", "{ nopeNotAField }"],
        ["a syntax error", "{ __typename "],
    ])("answers %s as the request-invalid code, without schema detail", async (_name, query) => {
        const vi = await doors().post<GraphqlFailureBody>(GRAPHQL, { query })
        const en = await doors().post<GraphqlFailureBody>(GRAPHQL, { query }, { "accept-language": "en" })
        const error = vi.body.errors?.[0]

        expect(vi.body.errors).toHaveLength(1)
        expect(error?.extensions).toMatchObject({
            code: "HTTP_SECURITY_REQUEST_INVALID",
            kind: "invalid",
            params: { fields: "operation" },
        })
        expect(en.body.errors?.[0]?.message).toBe("The submitted data is invalid: operation.")
        expect(error?.message).toBe("D\u1eef li\u1ec7u g\u1eedi l\u00ean kh\u00f4ng h\u1ee3p l\u1ec7: operation.")
        const text = JSON.stringify(vi.body)
        expect(text).not.toMatch(/ERRORS_INTERNAL|Did you mean|Cannot query|Syntax Error|nopeNotAField|stacktrace/u)
    })
})
