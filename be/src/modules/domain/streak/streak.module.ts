import { Module, type DynamicModule } from "@nestjs/common"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./streak.module-definition"
import { StreakService } from "./streak.service"

@Module({})
/** The streak capability: the one record of meaningful actions, days, freezes, goals and counters of the whole app. */
export class StreakModule extends ConfigurableModuleClass {
    /** Registers the streak service. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return { ...base, providers: [...(base.providers ?? []), StreakService], exports: [StreakService] }
    }
}
