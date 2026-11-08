import { QueryHandler } from "@nestjs/cqrs"
import { NotificationInboxService, type NotificationPage } from "@modules/domain/notification"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetMyNotificationsQuery } from "./get-my-notifications.query"

@QueryHandler(GetMyNotificationsQuery)
/** Reads a page of the authenticated learner's own notifications through one inbox-service call. */
export class GetMyNotificationsHandler extends ICQRSHandler<GetMyNotificationsQuery, NotificationPage> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly inbox: NotificationInboxService,
    ) {
        super(logger)
    }

    protected override process(query: GetMyNotificationsQuery): Promise<NotificationPage> {
        return this.inbox.page(query.params.principal.id, query.params.request)
    }
}
