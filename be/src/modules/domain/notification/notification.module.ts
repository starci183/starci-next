import { Module, type DynamicModule } from "@nestjs/common"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./notification.module-definition"
import { NOTIFICATION_PRODUCER } from "./notification.port"
import { NotificationService } from "./notification.service"
import { NotificationInboxService } from "./notification-inbox.service"

@Module({})
/** The notification capability: the producer port other parts call and the inbox the learner reads and marks. */
export class NotificationModule extends ConfigurableModuleClass {
    /** Registers the producer, the inbox and the producer token. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                NotificationService,
                NotificationInboxService,
                { provide: NOTIFICATION_PRODUCER, useExisting: NotificationService },
            ],
            exports: [NOTIFICATION_PRODUCER, NotificationInboxService],
        }
    }
}
