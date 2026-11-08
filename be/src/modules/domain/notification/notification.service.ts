import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import type { NotificationKind, NotificationParams } from "./notification.contracts"
import { NotificationLogEvent } from "./notification.log-events"
import type { NotificationProducerPort } from "./notification.port"
import { preparedNotification } from "./notification-input.policy"
import { INSERT_NOTIFICATION } from "./persistence/notification.sql"

@Injectable()
/** The only writer of new notifications: other parts reach it through the producer port. */
export class NotificationService implements NotificationProducerPort {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
    ) {}

    /**
     * Checks the kind, the params and the link, then stores one unread notification stamped by the clock. A refusal
     * (NOTIFICATION_KIND_UNKNOWN, NOTIFICATION_PARAMS_INVALID, NOTIFICATION_LINK_INVALID) or a failed write is logged and
     * swallowed: telling a learner never breaks the work of the part that asked, which calls this after its own commit.
     */
    async notify(learnerId: string, kind: NotificationKind, params: NotificationParams, link?: string): Promise<void> {
        try {
            const prepared = preparedNotification(kind, params, link)
            await this.entityManager.query(INSERT_NOTIFICATION, [
                learnerId,
                kind,
                JSON.stringify(prepared.params),
                prepared.link,
                this.clock.now(),
            ])
        } catch (cause) {
            this.logger.error(NotificationLogEvent.NotifyFailed, cause, { learnerId, kind })
        }
    }
}
