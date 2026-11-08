import { CommandHandler } from "@nestjs/cqrs"
import { NotificationInboxService } from "@modules/domain/notification"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { MarkNotificationsReadCommand } from "./mark-notifications-read.command"

@CommandHandler(MarkNotificationsReadCommand)
/** Marks the authenticated learner's own notifications read through one inbox-service call. */
export class MarkNotificationsReadHandler extends ICQRSHandler<MarkNotificationsReadCommand, number> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly inbox: NotificationInboxService,
    ) {
        super(logger)
    }

    protected override process(command: MarkNotificationsReadCommand): Promise<number> {
        return this.inbox.markRead(command.params.principal.id, command.params.request)
    }
}
