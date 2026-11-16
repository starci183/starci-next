import {
    bearerTokenOf,
    mcpTokenDigest,
    mcpTokenHint,
    mcpTokenNameOf,
    mcpTokenSecret,
    mcpTokenShaped,
} from "./mcp-token.policy"

describe("mcp token policy", () => {
    it("mints a prefixed, well-shaped, unique secret and stores only its digest", () => {
        const secret = mcpTokenSecret()
        expect(mcpTokenShaped(secret)).toBe(true)
        expect(secret).not.toBe(mcpTokenSecret())
        expect(mcpTokenDigest(secret)).toMatch(/^[0-9a-f]{64}$/u)
        expect(mcpTokenDigest(secret)).not.toContain(secret)
        expect(mcpTokenHint(secret)).toBe(secret.slice(-4))
    })

    it("reads only a well-formed bearer header", () => {
        const secret = mcpTokenSecret()
        expect(bearerTokenOf(`Bearer ${secret}`)).toBe(secret)
        expect(bearerTokenOf(secret)).toBeNull()
        expect(bearerTokenOf("Bearer nope")).toBeNull()
        expect(bearerTokenOf(undefined)).toBeNull()
    })

    it("trims a name and refuses an empty, long or control-character one", () => {
        expect(mcpTokenNameOf("  Claude ")).toBe("Claude")
        expect(mcpTokenNameOf("   ")).toBeNull()
        expect(mcpTokenNameOf("x".repeat(61))).toBeNull()
        expect(mcpTokenNameOf("a\u0007b")).toBeNull()
    })
})
