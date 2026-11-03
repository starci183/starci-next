import type { DynamicModule, Type } from "@nestjs/common"
import { IdentityModule } from "@modules/domain/identity"
import { LivenessModule } from "@modules/domain/liveness"
import { NoteModule } from "@modules/domain/note"
import { EntitlementModule } from "@modules/domain/entitlement"
import { PurchaseModule } from "@modules/domain/purchase"
import { KeycloakModule } from "@modules/integrations/keycloak"
import type { CoreOptions } from "../core.options"

/** The domain capabilities of the app; transport scaffolding moves the skeleton registrations here. */
export const domainModules = (options: CoreOptions): Array<Type<unknown> | DynamicModule> => [
    IdentityModule.register({ isGlobal: true, ...options.identity }),
    KeycloakModule.register({ isGlobal: true, ...options.keycloak }),
    LivenessModule.register({ isGlobal: true }),
    NoteModule.register({ isGlobal: true }),
    EntitlementModule.register({ isGlobal: true }),
    PurchaseModule.register({ isGlobal: true }),
]
