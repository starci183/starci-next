import { Query } from "@nestjs/cqrs"
import type { NotificationPage } from "@modules/domain/notification"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetMyNotificationsRequest } from "./get-my-notifications.contracts"

/** Asks for one page of the authenticated learner's notifications. */
export class GetMyNotificationsQuery extends Query<NotificationPage> {
    constructor(readonly params: ExecuteParams<GetMyNotificationsRequest>) {
        super()
    }
}
