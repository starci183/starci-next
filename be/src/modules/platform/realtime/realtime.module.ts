import { Module, type DynamicModule } from "@nestjs/common"
import { MemoryRealtimeHub } from "./memory-realtime.adapter"
import { REALTIME_HUB } from "./realtime.decorators"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./realtime.module-definition"

@Module({})
/** The realtime capability: the hub port bound to the hub the options name (memory, for one replica). */
export class RealtimeModule extends ConfigurableModuleClass {
    /** Registers the hub. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                MemoryRealtimeHub,
                { provide: REALTIME_HUB, useExisting: MemoryRealtimeHub },
            ],
            exports: [REALTIME_HUB, MemoryRealtimeHub],
        }
    }
}
