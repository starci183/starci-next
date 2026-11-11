import { Module, type DynamicModule } from "@nestjs/common"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./relay.module-definition"
import { RelayFeedService } from "./relay-feed.service"

@Module({})
/** The device feed of the relay app: signed manifests pushed through the realtime hub and the uploads it acknowledges. */
export class RelayFeedModule extends ConfigurableModuleClass {
    /** Registers the feed service; the app also composes `RelayModule` and the realtime hub. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return { ...base, providers: [...(base.providers ?? []), RelayFeedService], exports: [RelayFeedService] }
    }
}
