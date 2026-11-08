import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { HUB_EXPERIENCE } from "./hub-experience.port"
import { HubService } from "./hub.service"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./hub.module-definition"
import { NoHubExperienceClient } from "./no-hub-experience.client"

@Module({})
/** The hub capability: what the learner sees first, built from the streak and every shard's own read. */
export class HubModule extends ConfigurableModuleClass {
    /** Registers the hub service and binds the experience read the app names, or the one that reads nothing. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const experienceClass = options.experience ?? NoHubExperienceClient
        const experience: Provider = { provide: HUB_EXPERIENCE, useExisting: experienceClass }
        return {
            ...base,
            providers: [...(base.providers ?? []), experienceClass, experience, HubService],
            exports: [HubService],
        }
    }
}
