import type { DynamicModule, Type } from "@nestjs/common"
import { IdentityModule } from "@modules/domain/identity"
import { LivenessModule } from "@modules/domain/liveness"
import { NoteModule } from "@modules/domain/note"
import { EntitlementModule } from "@modules/domain/entitlement"
import { PurchaseModule } from "@modules/domain/purchase"

/** The domain capabilities of the app; transport scaffolding moves the skeleton registrations here. */
export const domainModules = (): Array<Type<unknown> | DynamicModule> => [
    IdentityModule.register({ isGlobal: true }),
    LivenessModule.register({ isGlobal: true }),
    NoteModule.register({ isGlobal: true }),
    EntitlementModule.register({ isGlobal: true }),
    PurchaseModule.register({ isGlobal: true }),
]
