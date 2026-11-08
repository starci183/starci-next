import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { KEYCLOAK_GATEWAY } from "@modules/integrations/keycloak"
import type { KeycloakGateway } from "@modules/integrations/keycloak"
import { LOGGER } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { IdentityLogEvent } from "./identity.log-events"
import { SocialAccountService } from "./social-account.service"

const build = async () => {
    const gateway = mock<KeycloakGateway>()
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            SocialAccountService,
            { provide: KEYCLOAK_GATEWAY, useValue: gateway },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { service: moduleRef.get(SocialAccountService), gateway, logger }
}

describe("SocialAccountService", () => {
    describe("usernameOf", () => {
        it("answers the login name of the account the verified email belongs to", async () => {
            const { service, gateway } = await build()
            gateway.findUserByEmail.mockResolvedValue({ subject: "learner-1", username: "ada.l" })
            await expect(service.usernameOf("ada@example.com")).resolves.toBe("ada.l")
            expect(gateway.findUserByEmail).toHaveBeenCalledWith("ada@example.com")
        })
        it("answers null for an email no account has", async () => {
            const { service, gateway } = await build()
            gateway.findUserByEmail.mockResolvedValue(null)
            await expect(service.usernameOf("ada@example.com")).resolves.toBeNull()
        })
        it("asks nothing when the token asserted no email", async () => {
            const { service, gateway } = await build()
            await expect(service.usernameOf(null)).resolves.toBeNull()
            expect(gateway.findUserByEmail).not.toHaveBeenCalled()
        })
        it("records a failed lookup and answers null so the sign-in goes on", async () => {
            const { service, gateway, logger } = await build()
            const cause = new Error("provider down")
            gateway.findUserByEmail.mockRejectedValue(cause)
            await expect(service.usernameOf("ada@example.com")).resolves.toBeNull()
            expect(logger.error).toHaveBeenCalledWith(IdentityLogEvent.AccountLookupFailed, cause)
        })
    })
})
