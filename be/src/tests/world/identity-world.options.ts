import { Global, Module, type DynamicModule } from "@nestjs/common"
import type { ModuleFactory } from "@starci/test-world"
import { IDENTITY_MESSAGES, IdentityModule } from "@modules/domain/identity"
import {
    OWN_TOKEN_VERIFIER,
    PASSPORT_AUTHENTICATOR,
    PASSPORT_OPTIONS,
    PassportModule,
    passportKit,
    type PassportOptions,
} from "@modules/integrations/passport"
import { I18nModule } from "@modules/platform/i18n"
import { mailModules } from "./mail-world.options"
import { passportOptionsOf } from "./test-apps.options"

@Global()
@Module({})
/** The passport ports the app composition binds once (its options and the verifier of its own access tokens), global like the app's. */
class PassportPortsModule {
    /** Registers the ports over the options of the run. */
    static register(options: PassportOptions): DynamicModule {
        const providers = [
            { provide: PASSPORT_OPTIONS, useValue: options },
            { provide: OWN_TOKEN_VERIFIER, useValue: passportKit(options).verify },
        ]
        return { module: PassportPortsModule, providers, exports: providers.map((provider) => provider.provide) }
    }
}

/** The modules of the identity worlds: the mail integration over the real mail sink, the app's own sign-in (passport) and the identity capability that answers it. */
export const identityModules: ReadonlyArray<ModuleFactory> = [
    ...mailModules,
    () => I18nModule.register({ isGlobal: true, bundles: [IDENTITY_MESSAGES] }),
    (w) => PassportPortsModule.register(passportOptionsOf(w)),
    (w) => PassportModule.register({ ...passportOptionsOf(w), authenticator: PASSPORT_AUTHENTICATOR, isGlobal: true }),
    (w) => IdentityModule.register({ isGlobal: true, verifyAccessToken: passportKit(passportOptionsOf(w)).verify }),
]
