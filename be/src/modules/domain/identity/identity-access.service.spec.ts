import { Test } from "@nestjs/testing"
import { builder, mock } from "@starci/jest-preset"
import { KEYCLOAK_GATEWAY, KeycloakError, KeycloakErrorCode } from "@modules/integrations/keycloak"
import type { KeycloakGateway, KeycloakTokens } from "@modules/integrations/keycloak"
import { LOGGER } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import type { IssuedChallenge, RotatedChallenge } from "./challenge.contracts"
import { ChallengeService } from "./challenge.service"
import { CodeMailService } from "./code-mail.service"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import { IdentityAccessService } from "./identity-access.service"
import { IdentityLogEvent } from "./identity.log-events"
import type { SessionIssued } from "./session.contracts"
import { SessionService } from "./session.service"
import { SocialAccountService } from "./social-account.service"
import { SocialService } from "./social.service"

const EXPIRES = new Date("2026-01-01T00:10:00.000Z")
const CHALLENGE = "c".repeat(43)
const STATE = "s".repeat(43)
const BUNDLE = { state: STATE, nonce: "n".repeat(43), codeChallenge: "challenge", maxAgeSeconds: 600 }
const tokensOf = builder<KeycloakTokens>({
    subject: "learner-1",
    roles: ["student"],
    email: "ada@example.com",
    username: "ada.l",
    name: null,
    refreshToken: "refresh-1",
    refreshExpiresAt: new Date("2026-01-01T01:00:00.000Z"),
})
const PAYLOAD = {
    subject: "learner-1",
    roles: ["student"],
    displayName: "ada.l",
    email: "ada@example.com",
    refreshToken: "refresh-1",
    refreshExpiresAt: "2026-01-01T01:00:00.000Z",
}
const SESSION_TOKENS = { ...PAYLOAD, refreshExpiresAt: new Date(PAYLOAD.refreshExpiresAt) }
const issuedOf = builder<IssuedChallenge>({ challenge: CHALLENGE, code: "123456", expiresAt: EXPIRES })
const sessionOf = builder<SessionIssued>({
    reference: "r".repeat(43),
    expiresAt: new Date("2026-01-01T01:00:00.000Z"),
    maxAgeSeconds: 3600,
})
const rotatedOf = builder<RotatedChallenge>({
    code: "654321",
    purpose: "sign-in",
    email: "ada@example.com",
    locale: "en",
    deliver: true,
    expiresAt: EXPIRES,
})
const refusal = (code: KeycloakErrorCode): KeycloakError => new KeycloakError({ code })
const build = async () => {
    const gateway = mock<KeycloakGateway>()
    const logger = mock<Logger>()
    const challenges = mock<ChallengeService>()
    const mail = mock<CodeMailService>()
    const sessions = mock<SessionService>()
    const social = mock<SocialService>()
    const accounts = mock<SocialAccountService>()
    mail.send.mockResolvedValue()
    gateway.resetPassword.mockResolvedValue()
    gateway.logoutAll.mockResolvedValue()
    sessions.revokeAllOf.mockResolvedValue()
    const moduleRef = await Test.createTestingModule({
        providers: [
            IdentityAccessService,
            { provide: KEYCLOAK_GATEWAY, useValue: gateway },
            { provide: LOGGER, useValue: logger },
            { provide: ChallengeService, useValue: challenges },
            { provide: CodeMailService, useValue: mail },
            { provide: SessionService, useValue: sessions },
            { provide: SocialService, useValue: social },
            { provide: SocialAccountService, useValue: accounts },
        ],
    }).compile()
    const service = moduleRef.get(IdentityAccessService)
    return { service, gateway, logger, challenges, mail, sessions, social, accounts }
}

describe("IdentityAccessService", () => {
    describe("signIn", () => {
        it("checks the password at the provider, holds the tokens in a sealed challenge and mails the code", async () => {
            const { service, gateway, challenges, mail } = await build()
            gateway.passwordGrant.mockResolvedValue(tokensOf())
            challenges.issue.mockResolvedValue(issuedOf())
            await expect(service.signIn({ identifier: " ada ", password: "secret1" })).resolves.toEqual({
                challenge: CHALLENGE,
                email: "a***@example.com",
                expiresAt: EXPIRES,
            })
            expect(gateway.passwordGrant).toHaveBeenCalledWith("ada", "secret1")
            expect(challenges.issue).toHaveBeenCalledWith({
                purpose: "sign-in",
                email: "ada@example.com",
                locale: "vi",
                deliver: true,
                payload: PAYLOAD,
            })
            expect(mail.send).toHaveBeenCalledWith(expect.objectContaining({ purpose: "sign-in", code: "123456" }))
        })
        it("falls back to the identifier when the token asserts no email and the identifier is one", async () => {
            const { service, gateway, challenges } = await build()
            gateway.passwordGrant.mockResolvedValue(tokensOf({ email: null }))
            challenges.issue.mockResolvedValue(issuedOf())
            await service.signIn({ identifier: "Ada@Example.com", password: "secret1" })
            expect(challenges.issue).toHaveBeenCalledWith(expect.objectContaining({ payload: PAYLOAD }))
        })
        it("refuses as unavailable when there is no address to mail the code to", async () => {
            const { service, gateway, challenges } = await build()
            gateway.passwordGrant.mockResolvedValue(tokensOf({ email: null }))
            await expect(service.signIn({ identifier: "ada", password: "secret1" })).rejects.toMatchObject({
                code: IdentityErrorCode.ProviderUnavailable,
            })
            expect(challenges.issue).not.toHaveBeenCalled()
        })
        it.each([
            { identifier: "   ", password: "secret1" },
            { identifier: "a".repeat(321), password: "secret1" },
            { identifier: "ada", password: "" },
            { identifier: "ada", password: "p".repeat(1025) },
        ])("refuses unusable credentials generically without asking the provider", async (input) => {
            const { service, gateway } = await build()
            await expect(service.signIn(input)).rejects.toMatchObject({ code: IdentityErrorCode.CredentialsRejected })
            expect(gateway.passwordGrant).not.toHaveBeenCalled()
        })
        it.each([
            [KeycloakErrorCode.CredentialsRejected, IdentityErrorCode.CredentialsRejected],
            [KeycloakErrorCode.Unavailable, IdentityErrorCode.ProviderUnavailable],
            [KeycloakErrorCode.EmailRegistered, IdentityErrorCode.ProviderUnavailable],
        ])("maps the provider answer %s to %s and opens no challenge", async (provider, expected) => {
            const { service, gateway, challenges } = await build()
            gateway.passwordGrant.mockRejectedValue(refusal(provider))
            await expect(service.signIn({ identifier: "ada", password: "secret1" })).rejects.toMatchObject({
                code: expected,
            })
            expect(challenges.issue).not.toHaveBeenCalled()
        })
    })
})

describe("IdentityAccessService", () => {
    describe("verifySignIn", () => {
        it("persists the session for the tokens the challenge held", async () => {
            const { service, challenges, sessions } = await build()
            challenges.attempt.mockResolvedValue({
                email: "ada@example.com",
                payload: JSON.stringify(PAYLOAD),
            })
            sessions.issue.mockResolvedValue(sessionOf())
            await expect(service.verifySignIn({ challenge: CHALLENGE, code: "123456" })).resolves.toEqual(sessionOf())
            expect(sessions.issue).toHaveBeenCalledWith(SESSION_TOKENS)
        })
    })
})

describe("IdentityAccessService", () => {
    describe("resendCode", () => {
        it("mails the rotated code to the challenge's account in its language", async () => {
            const { service, challenges, mail } = await build()
            challenges.rotate.mockResolvedValue(rotatedOf())
            await service.resendCode({ challenge: CHALLENGE })
            expect(mail.send).toHaveBeenCalledWith({
                email: "ada@example.com",
                purpose: "sign-in",
                locale: "en",
                code: "654321",
                expiresAt: EXPIRES,
            })
        })
        it("mails nothing for a challenge that has no account behind it", async () => {
            const { service, challenges, mail } = await build()
            challenges.rotate.mockResolvedValue(rotatedOf({ purpose: "password-reset", deliver: false }))
            await expect(service.resendCode({ challenge: CHALLENGE })).resolves.toBeUndefined()
            expect(mail.send).not.toHaveBeenCalled()
        })
        it("refuses an unmailable sign-in code but hides an unmailable reset code", async () => {
            const { service, challenges, mail, logger } = await build()
            const cause = new IdentityError({ code: IdentityErrorCode.ProviderUnavailable })
            mail.send.mockRejectedValue(cause)
            challenges.rotate.mockResolvedValueOnce(rotatedOf())
            await expect(service.resendCode({ challenge: CHALLENGE })).rejects.toBe(cause)
            challenges.rotate.mockResolvedValueOnce(rotatedOf({ purpose: "password-reset" }))
            await expect(service.resendCode({ challenge: CHALLENGE })).resolves.toBeUndefined()
            expect(logger.error).toHaveBeenCalledWith(IdentityLogEvent.ResetMailFailed, cause)
        })
    })
})

describe("IdentityAccessService", () => {
    describe("signUp", () => {
        it("seals the chosen account into the challenge and creates nothing at the provider", async () => {
            const { service, gateway, challenges, mail } = await build()
            gateway.findUserByEmail.mockResolvedValue(null)
            challenges.issue.mockResolvedValue(issuedOf())
            await expect(
                service.signUp({
                    email: " Ada@Example.com ",
                    password: "secret1",
                    username: "ada.l",
                    acceptTerms: true,
                    locale: "en",
                }),
            ).resolves.toEqual({ challenge: CHALLENGE, email: "a***@example.com", expiresAt: EXPIRES })
            expect(gateway.findUserByEmail).toHaveBeenCalledWith("ada@example.com")
            expect(gateway.createUser).not.toHaveBeenCalled()
            expect(challenges.issue).toHaveBeenCalledWith({
                purpose: "sign-up",
                email: "ada@example.com",
                locale: "en",
                deliver: true,
                payload: { email: "ada@example.com", username: "ada.l", password: "secret1" },
            })
            expect(mail.send).toHaveBeenCalledWith(expect.objectContaining({ purpose: "sign-up", locale: "en" }))
        })
        it("defaults the username to the email", async () => {
            const { service, gateway, challenges } = await build()
            gateway.findUserByEmail.mockResolvedValue(null)
            challenges.issue.mockResolvedValue(issuedOf())
            await service.signUp({ email: "ada@example.com", password: "secret1", acceptTerms: true })
            const payload = challenges.issue.mock.calls[0]?.[0].payload
            expect(payload).toEqual({ email: "ada@example.com", username: "ada@example.com", password: "secret1" })
        })
        it.each([
            [{ password: "short" }, IdentityErrorCode.PasswordInvalid],
            [{ password: "p".repeat(257) }, IdentityErrorCode.PasswordInvalid],
            [{ username: "ab" }, IdentityErrorCode.UsernameInvalid],
            [{ username: "u".repeat(101) }, IdentityErrorCode.UsernameInvalid],
        ])("refuses %j before reaching the provider", async (overrides, code) => {
            const { service, gateway } = await build()
            await expect(
                service.signUp({ email: "ada@example.com", password: "secret1", acceptTerms: true, ...overrides }),
            ).rejects.toMatchObject({ code })
            expect(gateway.findUserByEmail).not.toHaveBeenCalled()
        })
        it("refuses an email that already has an account and opens no challenge", async () => {
            const { service, gateway, challenges } = await build()
            gateway.findUserByEmail.mockResolvedValue({ subject: "learner-1", username: "ada" })
            await expect(
                service.signUp({ email: "ada@example.com", password: "secret1", acceptTerms: true }),
            ).rejects.toMatchObject({ code: IdentityErrorCode.EmailRegistered })
            expect(challenges.issue).not.toHaveBeenCalled()
        })
        it("refuses as unavailable when the provider cannot be asked", async () => {
            const { service, gateway } = await build()
            gateway.findUserByEmail.mockRejectedValue(refusal(KeycloakErrorCode.Unavailable))
            await expect(
                service.signUp({ email: "ada@example.com", password: "secret1", acceptTerms: true }),
            ).rejects.toMatchObject({ code: IdentityErrorCode.ProviderUnavailable })
        })
    })
})

describe("IdentityAccessService", () => {
    describe("verifySignUp", () => {
        const payload = '{"email":"ada@example.com","username":"ada.l","password":"secret1"}'
        it("creates the account after the code, signs it in and persists the session", async () => {
            const { service, gateway, challenges, sessions } = await build()
            challenges.attempt.mockResolvedValue({ email: "ada@example.com", payload })
            gateway.createUser.mockResolvedValue({ subject: "learner-2" })
            gateway.passwordGrant.mockResolvedValue(tokensOf())
            sessions.issue.mockResolvedValue(sessionOf())
            await expect(service.verifySignUp({ challenge: CHALLENGE, code: "123456" })).resolves.toEqual(sessionOf())
            expect(gateway.createUser).toHaveBeenCalledWith({
                email: "ada@example.com",
                username: "ada.l",
                password: "secret1",
            })
            expect(gateway.passwordGrant).toHaveBeenCalledWith("ada.l", "secret1")
            expect(sessions.issue).toHaveBeenCalledWith(SESSION_TOKENS)
        })
        it.each([
            [KeycloakErrorCode.EmailRegistered, IdentityErrorCode.EmailRegistered],
            [KeycloakErrorCode.PasswordInvalid, IdentityErrorCode.PasswordInvalid],
            [KeycloakErrorCode.Unavailable, IdentityErrorCode.ProviderUnavailable],
        ])("maps the provider answer %s to %s on account creation and signs nobody in", async (provider, expected) => {
            const { service, gateway, challenges } = await build()
            challenges.attempt.mockResolvedValue({ email: "ada@example.com", payload })
            gateway.createUser.mockRejectedValue(refusal(provider))
            await expect(service.verifySignUp({ challenge: CHALLENGE, code: "1" })).rejects.toMatchObject({
                code: expected,
            })
            expect(gateway.passwordGrant).not.toHaveBeenCalled()
        })
        it("issues no session when the provider will not sign the new account in", async () => {
            const { service, gateway, challenges, sessions } = await build()
            challenges.attempt.mockResolvedValue({ email: "ada@example.com", payload })
            gateway.createUser.mockResolvedValue({ subject: "learner-2" })
            gateway.passwordGrant.mockRejectedValue(refusal(KeycloakErrorCode.CredentialsRejected))
            await expect(service.verifySignUp({ challenge: CHALLENGE, code: "1" })).rejects.toBeInstanceOf(
                IdentityError,
            )
            expect(sessions.issue).not.toHaveBeenCalled()
        })
    })
})

describe("IdentityAccessService", () => {
    describe("requestPasswordReset", () => {
        it("opens a challenge bound to the account and mails the code", async () => {
            const { service, gateway, challenges, mail } = await build()
            gateway.findUserByEmail.mockResolvedValue({ subject: "learner-1", username: "ada" })
            challenges.issue.mockResolvedValue(issuedOf())
            await expect(service.requestPasswordReset({ email: " Ada@Example.com " })).resolves.toEqual({
                challenge: CHALLENGE,
                expiresAt: EXPIRES,
            })
            expect(gateway.findUserByEmail).toHaveBeenCalledWith("ada@example.com")
            expect(challenges.issue).toHaveBeenCalledWith({
                purpose: "password-reset",
                email: "ada@example.com",
                locale: "vi",
                deliver: true,
                payload: { subject: "learner-1" },
            })
            expect(mail.send).toHaveBeenCalledWith({
                email: "ada@example.com",
                purpose: "password-reset",
                locale: "vi",
                code: "123456",
                expiresAt: EXPIRES,
            })
        })
        it("answers an unknown email exactly the same way and mails nothing", async () => {
            const { service, gateway, challenges, mail } = await build()
            gateway.findUserByEmail.mockResolvedValue(null)
            challenges.issue.mockResolvedValue(issuedOf())
            await expect(service.requestPasswordReset({ email: "nobody@example.com", locale: "en" })).resolves.toEqual({
                challenge: CHALLENGE,
                expiresAt: EXPIRES,
            })
            expect(challenges.issue).toHaveBeenCalledWith({
                purpose: "password-reset",
                email: "nobody@example.com",
                locale: "en",
                deliver: false,
                payload: { subject: null },
            })
            expect(mail.send).not.toHaveBeenCalled()
        })
        it("records but hides a mail failure so a registered email looks like an unknown one", async () => {
            const { service, gateway, challenges, mail, logger } = await build()
            const cause = new IdentityError({ code: IdentityErrorCode.ProviderUnavailable })
            gateway.findUserByEmail.mockResolvedValue({ subject: "learner-1", username: "ada" })
            challenges.issue.mockResolvedValue(issuedOf())
            mail.send.mockRejectedValue(cause)
            await expect(service.requestPasswordReset({ email: "ada@example.com" })).resolves.toEqual({
                challenge: CHALLENGE,
                expiresAt: EXPIRES,
            })
            expect(logger.error).toHaveBeenCalledWith(IdentityLogEvent.ResetMailFailed, cause)
        })
        it("refuses as unavailable when the provider cannot be asked", async () => {
            const { service, gateway, challenges } = await build()
            gateway.findUserByEmail.mockRejectedValue(refusal(KeycloakErrorCode.Unavailable))
            await expect(service.requestPasswordReset({ email: "ada@example.com" })).rejects.toMatchObject({
                code: IdentityErrorCode.ProviderUnavailable,
            })
            expect(challenges.issue).not.toHaveBeenCalled()
        })
    })
})

describe("IdentityAccessService", () => {
    describe("verifyPasswordReset", () => {
        const input = { challenge: CHALLENGE, code: "123456", password: "new-secret" }
        it("sets the password, revokes every local session and ends the provider sessions, in that order", async () => {
            const { service, gateway, challenges, sessions } = await build()
            challenges.attempt.mockResolvedValue({ email: "ada@example.com", payload: '{"subject":"learner-1"}' })
            await service.verifyPasswordReset(input)
            const at = (calls: Array<number>): number => Math.min(...calls)
            const reset = at(gateway.resetPassword.mock.invocationCallOrder)
            const revoke = at(sessions.revokeAllOf.mock.invocationCallOrder)
            expect(reset).toBeLessThan(revoke)
            expect(revoke).toBeLessThan(at(gateway.logoutAll.mock.invocationCallOrder))
        })
        it("refuses a password outside 6 to 256 characters before consuming the challenge", async () => {
            const { service, challenges } = await build()
            await expect(service.verifyPasswordReset({ ...input, password: "short" })).rejects.toMatchObject({
                code: IdentityErrorCode.PasswordInvalid,
            })
            expect(challenges.attempt).not.toHaveBeenCalled()
        })
        it("treats a challenge opened for an unknown email as expired even with a matching code", async () => {
            const { service, gateway, challenges } = await build()
            challenges.attempt.mockResolvedValue({ email: "nobody@example.com", payload: '{"subject":null}' })
            await expect(service.verifyPasswordReset(input)).rejects.toMatchObject({
                code: IdentityErrorCode.ChallengeExpired,
            })
            expect(gateway.resetPassword).not.toHaveBeenCalled()
        })
        it.each([
            [KeycloakErrorCode.PasswordInvalid, IdentityErrorCode.PasswordInvalid],
            [KeycloakErrorCode.Unavailable, IdentityErrorCode.ProviderUnavailable],
        ])("maps the provider answer %s to %s and revokes no session", async (provider, expected) => {
            const { service, gateway, challenges, sessions } = await build()
            challenges.attempt.mockResolvedValue({ email: "ada@example.com", payload: '{"subject":"learner-1"}' })
            gateway.resetPassword.mockRejectedValue(refusal(provider))
            await expect(service.verifyPasswordReset(input)).rejects.toMatchObject({ code: expected })
            expect(sessions.revokeAllOf).not.toHaveBeenCalled()
        })
        it("keeps the reset when only the provider's own logout fails, and records it", async () => {
            const { service, gateway, challenges, logger } = await build()
            const cause = refusal(KeycloakErrorCode.Unavailable)
            challenges.attempt.mockResolvedValue({ email: "ada@example.com", payload: '{"subject":"learner-1"}' })
            gateway.logoutAll.mockRejectedValue(cause)
            await expect(service.verifyPasswordReset(input)).resolves.toBeUndefined()
            expect(logger.error).toHaveBeenCalledWith(IdentityLogEvent.ProviderLogoutAllFailed, cause)
        })
    })
})

describe("IdentityAccessService", () => {
    describe("startSocial", () => {
        it("stores a bundle and answers the provider URL for the chosen broker", async () => {
            const { service, gateway, social } = await build()
            social.begin.mockResolvedValue(BUNDLE)
            const url = "https://idp.example/auth?kc_idp_hint=github"
            gateway.socialAuthorizationUrl.mockResolvedValue(url)
            const started = await service.startSocial({ provider: "github", returnTo: "/courses" })
            expect(started).toEqual({ authorizationUrl: url, binding: STATE, bindingMaxAgeSeconds: 600 })
            expect(social.begin).toHaveBeenCalledWith("/courses")
            expect(gateway.socialAuthorizationUrl).toHaveBeenCalledWith({
                provider: "github",
                state: STATE,
                nonce: "n".repeat(43),
                codeChallenge: "challenge",
            })
        })
        it("refuses a provider that is not offered before storing anything", async () => {
            const { service, social } = await build()
            const started = service.startSocial({ provider: "google" })
            await expect(started).rejects.toMatchObject({ code: IdentityErrorCode.ProviderUnknown })
            expect(social.begin).not.toHaveBeenCalled()
        })
        it("refuses as unavailable when the provider address cannot be built", async () => {
            const { service, gateway, social } = await build()
            const cause = new KeycloakError({ code: KeycloakErrorCode.Unavailable })
            social.begin.mockResolvedValue(BUNDLE)
            gateway.socialAuthorizationUrl.mockRejectedValue(cause)
            const started = service.startSocial({ provider: "facebook" })
            await expect(started).rejects.toMatchObject({ code: IdentityErrorCode.ProviderUnavailable, cause })
        })
    })
})

describe("IdentityAccessService", () => {
    describe("exchangeSocial", () => {
        const claimed = { nonce: "n".repeat(43), codeVerifier: "v".repeat(43), returnTo: "/courses" }
        const EXCHANGE = { code: "auth-code", state: STATE, binding: STATE }
        it("exchanges the code with the bundle's verifier and issues a session that returns to the stored path", async () => {
            const { service, gateway, social, accounts, sessions } = await build()
            social.claim.mockResolvedValue(claimed)
            gateway.exchangeSocialCode.mockResolvedValue(tokensOf({ username: null }))
            accounts.usernameOf.mockResolvedValue("ada.l")
            sessions.issue.mockResolvedValue(sessionOf())
            await expect(service.exchangeSocial(EXCHANGE)).resolves.toEqual({
                ...sessionOf(),
                returnTo: "/courses",
            })
            expect(social.claim).toHaveBeenCalledWith(STATE)
            expect(gateway.exchangeSocialCode).toHaveBeenCalledWith({
                code: "auth-code",
                codeVerifier: "v".repeat(43),
                nonce: "n".repeat(43),
            })
            expect(sessions.issue).toHaveBeenCalledWith(SESSION_TOKENS)
        })
        it.each(["", "c".repeat(4097)])("refuses an unusable code after consuming the bundle", async (code) => {
            const { service, gateway, social } = await build()
            social.claim.mockResolvedValue(claimed)
            await expect(service.exchangeSocial({ code, state: STATE, binding: STATE })).rejects.toMatchObject({
                code: IdentityErrorCode.SocialRejected,
            })
            expect(gateway.exchangeSocialCode).not.toHaveBeenCalled()
        })
        it.each([
            [KeycloakErrorCode.SocialRejected, IdentityErrorCode.SocialRejected],
            [KeycloakErrorCode.Unavailable, IdentityErrorCode.ProviderUnavailable],
        ])("maps the provider answer %s to %s and issues no session", async (provider, expected) => {
            const { service, gateway, social, sessions } = await build()
            social.claim.mockResolvedValue(claimed)
            gateway.exchangeSocialCode.mockRejectedValue(refusal(provider))
            await expect(service.exchangeSocial(EXCHANGE)).rejects.toMatchObject({ code: expected })
            expect(sessions.issue).not.toHaveBeenCalled()
        })
        it.each([undefined, "o".repeat(43), "short"])(
            "refuses the binding %s before touching the bundle (login CSRF)",
            async (binding) => {
                const { service, gateway, social, sessions } = await build()
                const exchanged = service.exchangeSocial({ ...EXCHANGE, binding })
                await expect(exchanged).rejects.toMatchObject({ code: IdentityErrorCode.SocialStateInvalid })
                const calls = social.claim.mock.calls.length + gateway.exchangeSocialCode.mock.calls.length
                expect(calls + sessions.issue.mock.calls.length).toBe(0)
            },
        )
    })
})
