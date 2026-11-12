import { Test } from "@nestjs/testing"
import { builder, mock } from "@starci/jest-preset"
import { KEYCLOAK_GATEWAY, KeycloakError, KeycloakErrorCode } from "@modules/integrations/keycloak"
import type { KeycloakGateway, KeycloakTokens } from "@modules/integrations/keycloak"
import { LOGGER } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { ChallengeService } from "./challenge.service"
import { CodeMailService } from "./code-mail.service"
import { IdentityErrorCode } from "./errors/identity.error"
import { IdentityAccessService } from "./identity-access.service"
import type { SessionIssued } from "./session.contracts"
import { SessionService } from "./session.service"
import { SocialAccountService } from "./social-account.service"
import { SocialService } from "./social.service"

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
const sessionOf = builder<SessionIssued>({
    reference: "r".repeat(43),
    expiresAt: new Date("2026-01-01T01:00:00.000Z"),
    maxAgeSeconds: 3600,
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
