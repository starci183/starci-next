import { Module, type DynamicModule } from "@nestjs/common"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./relay.module-definition"
import { RelayDeviceService } from "./relay-device.service"
import { RelayFeedService } from "./relay-feed.service"
import { RelayCredentialAdapter } from "./relay-credential.adapter"
import { RelayProjectService } from "./relay-project.service"
import { RelayLessonService } from "./relay-lesson.service"
import { RelayHarnessService } from "./relay-harness.service"
import { RelayLabService } from "./relay-lab.service"

@Module({})
/**
 * The relay capability: device pairing, the device list and revoke, device-token authentication, the project practice
 * port, the lesson scenario runs, the lab of a lesson on the learner's machine (its contract port, state, doors and grading) and the device feed (signed manifests pushed through the realtime hub and the uploads it acknowledges). The app
 * that composes it also composes the realtime hub.
 */
export class RelayModule extends ConfigurableModuleClass {
    /** Registers the device service, the credential port, the project port and the feed. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                RelayLabService,
                RelayDeviceService,
                RelayCredentialAdapter,
                RelayProjectService,
                RelayFeedService,
                RelayLessonService,
                RelayHarnessService,
            ],
            exports: [
                RelayLabService,
                RelayDeviceService,
                RelayCredentialAdapter,
                RelayProjectService,
                RelayFeedService,
                RelayLessonService,
                RelayHarnessService,
            ],
        }
    }
}
