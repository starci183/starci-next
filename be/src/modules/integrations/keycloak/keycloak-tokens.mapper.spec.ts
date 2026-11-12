import { Test } from "@nestjs/testing"
import type { OidcBrokerSession, OidcGrant } from "@starci/auth/oidc"
import { toGrantTokens, toSocialTokens } from "./keycloak-tokens.mapper"

const MAPPER: unique symbol = Symbol("keycloak.tokens-mapper")
const mappers = { toGrantTokens, toSocialTokens }
const EXPIRES = new Date("2026-01-01T01:00:00.000Z")
const grantOf = (principal: Partial<OidcGrant["principal"]>): OidcGrant => ({
    principal: {
        id: "learner-1",
        role: "authenticated",
        sessionId: "sid-1",
        roles: ["student"],
        issuer: "https://idp.test/realms/test",
        expiresAt: EXPIRES,
        ...principal,
    },
    subject: "learner-1",
    roles: ["student"],
    email: "ada@example.com",
    refreshToken: "refresh-1",
    refreshExpiresAt: EXPIRES,
})

describe("keycloak token mapping", () => {
    let subject: typeof mappers
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: MAPPER, useFactory: () => mappers }],
        }).compile()
        subject = moduleRef.get<typeof mappers>(MAPPER)
    })

    it("carries the preferred username and the name claims of a grant's verified principal", () => {
        expect(subject.toGrantTokens(grantOf({ username: "ada.l", name: "Ada Lovelace" }))).toEqual({
            subject: "learner-1",
            roles: ["student"],
            email: "ada@example.com",
            username: "ada.l",
            name: "Ada Lovelace",
            refreshToken: "refresh-1",
            refreshExpiresAt: EXPIRES,
        })
    })

    it("answers null for the claims a grant's token does not carry", () => {
        expect(subject.toGrantTokens(grantOf({}))).toMatchObject({ username: null, name: null })
    })

    it("answers a social session with no name claims, because the code exchange yields none", () => {
        const session: OidcBrokerSession = {
            subject: "learner-1",
            roles: ["student"],
            email: null,
            refreshToken: "refresh-1",
            refreshExpiresAt: EXPIRES,
        }
        expect(subject.toSocialTokens(session)).toEqual({ ...session, username: null, name: null })
    })
})
