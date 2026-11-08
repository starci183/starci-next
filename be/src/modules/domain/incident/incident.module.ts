import { Module, type DynamicModule } from "@nestjs/common"
import { IncidentReadService } from "./incident-read.service"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./incident.module-definition"

@Module({})
/** The incident list capability: the live Essentials lessons and whether their tier-2 incident is written. */
export class IncidentModule extends ConfigurableModuleClass {
    /** Registers the read service over the lesson catalog. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [...(base.providers ?? []), IncidentReadService],
            exports: [IncidentReadService],
        }
    }
}
