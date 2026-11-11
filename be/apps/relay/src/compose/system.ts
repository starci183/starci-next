import type { DynamicModule, Type } from "@nestjs/common"
import { SystemHealthHttpModule } from "@features/api/system-health"
import { LivenessModule } from "@modules/domain/liveness"

/** The system probes of the relay app: the liveness capability the health door reads, then the door. */
export const systemModules = (): Array<Type<unknown> | DynamicModule> => [
    LivenessModule.register({ isGlobal: true }),
    SystemHealthHttpModule.register({}),
]
