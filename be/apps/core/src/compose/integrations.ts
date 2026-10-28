import type { DynamicModule } from "@nestjs/common"
import { AiPoolModule } from "@modules/integrations/ai-pool"
import type { CoreOptions } from "../core.options"

/** The integration area of the core app: external services behind guarded ports, registered from options parsed at boot. */
export const integrationModules = (options: CoreOptions): Array<DynamicModule> => [
    AiPoolModule.register({ isGlobal: true, ...options.aiPool }),
]
