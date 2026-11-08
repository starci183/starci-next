import { Module, type DynamicModule } from "@nestjs/common"
import { AgentLabQuotaService } from "./agent-lab-quota.service"
import { AgentLabReadService } from "./agent-lab-read.service"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./agent-lab.module-definition"

@Module({})
/** The agent lab capability: tool tracks, the seven mindset concepts, the lab grid and the daily model-call cap. */
export class AgentLabModule extends ConfigurableModuleClass {
    /** Registers the read service and the quota service. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [...(base.providers ?? []), AgentLabReadService, AgentLabQuotaService],
            exports: [AgentLabReadService, AgentLabQuotaService],
        }
    }
}
