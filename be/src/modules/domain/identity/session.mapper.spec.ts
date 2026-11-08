import { Test } from "@nestjs/testing"
import { builder } from "@starci/jest-preset"
import type { IdentitySessionRow } from "./persistence/sessions.rows"
import type { KeycloakTokens } from "@modules/integrations/keycloak"
import { toSessionTokensOf, toSessionView } from "./session.mapper"

const MAPPER: unique symbol = Symbol("identity.session-mapper")
const mappers = { toSessionTokensOf, toSessionView }
const rowOf = builder<IdentitySessionRow>({
    subject: "learner-1",
    roles: ["student"],
    display_name: "Ada L",
    email: "ada@example.com",
    refresh_ciphertext: "v1.sealed",
    refresh_expires_at: new Date("2026-01-01T02:00:00.000Z"),
    expires_at: new Date("2026-01-01T01:00:00.000Z"),
    issued_at: new Date("2026-01-01T00:00:00.000Z"),
})

describe("session mapping", () => {
    it("exposes only the subject, the provider roles, the name, the email and the expiry", async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: MAPPER, useFactory: () => mappers }],
        }).compile()
        const subject = moduleRef.get<typeof mappers>(MAPPER)
        expect(subject.toSessionView(rowOf())).toEqual({
            identity: { subject: "learner-1", roles: ["student"], displayName: "Ada L", email: "ada@example.com" },
            expiresAt: "2026-01-01T01:00:00.000Z",
        })
    })
    it("exposes a session issued without a name or email as nulls", async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: MAPPER, useFactory: () => mappers }],
        }).compile()
        const subject = moduleRef.get<typeof mappers>(MAPPER)
        expect(subject.toSessionView(rowOf({ display_name: null, email: null })).identity).toEqual({
            subject: "learner-1",
            roles: ["student"],
            displayName: null,
            email: null,
        })
    })
    it("cleans the claims of verified provider tokens into session material", async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: MAPPER, useFactory: () => mappers }],
        }).compile()
        const subject = moduleRef.get<typeof mappers>(MAPPER)
        const tokens: KeycloakTokens = {
            subject: "learner-1",
            roles: ["student"],
            email: " ada@example.com ",
            username: "  ",
            name: "Ada\u0007 Lovelace",
            refreshToken: "refresh-1",
            refreshExpiresAt: new Date("2026-01-01T02:00:00.000Z"),
        }
        expect(subject.toSessionTokensOf(tokens)).toEqual({
            subject: "learner-1",
            roles: ["student"],
            displayName: "Ada Lovelace",
            email: "ada@example.com",
            refreshToken: "refresh-1",
            refreshExpiresAt: new Date("2026-01-01T02:00:00.000Z"),
        })
    })
})
