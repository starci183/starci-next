import { randomBytes } from "node:crypto"
import type { ModuleFactory } from "@starci/test-world"
import { IDENTITY_MESSAGES, IdentityModule } from "@modules/domain/identity"
import { Secret } from "@modules/platform/config"
import { I18nModule } from "@modules/platform/i18n"
import { keycloakModules } from "./keycloak-world.options"
import { mailModules } from "./mail-world.options"

/** The modules of the identity worlds: the gateway over the issuer fake, the mail integration over the real mail sink, then the identity capability. */
export const identityModules: ReadonlyArray<ModuleFactory> = [
    ...keycloakModules,
    ...mailModules,
    () => I18nModule.register({ isGlobal: true, bundles: [IDENTITY_MESSAGES] }),
    () =>
        IdentityModule.register({
            isGlobal: true,
            sessionMaxSeconds: 28800,
            challengeTtlSeconds: 600,
            challengeMaxAttempts: 5,
            sessionEncryptionKey: new Secret(randomBytes(32).toString("base64url")),
        }),
]
