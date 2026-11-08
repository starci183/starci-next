import { Test } from "@nestjs/testing"
import { KeycloakError, KeycloakErrorCode } from "@modules/integrations/keycloak"
import { IdentityErrorCode } from "./errors/identity.error"
import { codeOf, identityFailure, providerUnreachable } from "./provider-failure.policy"

const POLICY: unique symbol = Symbol("identity.provider-failure-policy")
const policies = { codeOf, identityFailure, providerUnreachable }

describe("provider failure policy", () => {
    let subject: typeof policies
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: POLICY, useFactory: () => policies }],
        }).compile()
        subject = moduleRef.get<typeof policies>(POLICY)
    })

    it("reads the stable code of a failure, and nothing from anything else", () => {
        expect(subject.codeOf(new KeycloakError({ code: KeycloakErrorCode.Unavailable }))).toBe("KEYCLOAK_UNAVAILABLE")
        expect(subject.codeOf(new Error("plain"))).toBeUndefined()
        expect(subject.codeOf({ code: 7 })).toBeUndefined()
        expect(subject.codeOf("text")).toBeUndefined()
        expect(subject.codeOf(null)).toBeUndefined()
    })

    it("tells an unreachable provider from a refusal", () => {
        expect(subject.providerUnreachable(new KeycloakError({ code: KeycloakErrorCode.Unavailable }))).toBe(true)
        expect(subject.providerUnreachable(new KeycloakError({ code: KeycloakErrorCode.CredentialsRejected }))).toBe(
            false,
        )
    })

    it.each([
        [KeycloakErrorCode.CredentialsRejected, IdentityErrorCode.CredentialsRejected],
        [KeycloakErrorCode.EmailRegistered, IdentityErrorCode.EmailRegistered],
        [KeycloakErrorCode.PasswordInvalid, IdentityErrorCode.PasswordInvalid],
        [KeycloakErrorCode.SocialRejected, IdentityErrorCode.SocialRejected],
        [KeycloakErrorCode.Unavailable, IdentityErrorCode.ProviderUnavailable],
    ])("maps %s to %s when the operation allows it", (provider, expected) => {
        const cause = new KeycloakError({ code: provider })
        const error = subject.identityFailure(cause, [
            IdentityErrorCode.CredentialsRejected,
            IdentityErrorCode.EmailRegistered,
            IdentityErrorCode.PasswordInvalid,
            IdentityErrorCode.SocialRejected,
        ])
        expect(error.code).toBe(expected)
        expect(error.cause).toBe(cause)
    })

    it("turns a refusal the operation does not allow, and any foreign failure, into provider unavailable", () => {
        expect(
            subject.identityFailure(new KeycloakError({ code: KeycloakErrorCode.CredentialsRejected }), []).code,
        ).toBe(IdentityErrorCode.ProviderUnavailable)
        expect(subject.identityFailure(new Error("socket"), [IdentityErrorCode.CredentialsRejected]).code).toBe(
            IdentityErrorCode.ProviderUnavailable,
        )
    })
})
