import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { NotificationPage } from "@modules/domain/notification"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetMyNotificationsRequest } from "../../application/get-my-notifications.contracts"
import type { MyNotificationsInput } from "./dto/my-notifications.input"
import type { NotificationPageType } from "./dto/notification-page.type"

/** Maps the GraphQL input and the session to the query params. */
export const toGetMyNotificationsParams = (
    identity: IdentityPrincipal,
    input: MyNotificationsInput,
): ExecuteParams<GetMyNotificationsRequest> => ({
    request: { after: input.after, limit: input.limit },
    principal: toPrincipal(identity),
})

/** Maps a page of notifications to the GraphQL type. */
export const toNotificationPageType = (result: NotificationPage): NotificationPageType => ({
    items: result.items.map((item) => ({
        id: item.id,
        kind: item.kind,
        params: item.params.map((param) => ({ key: param.key, value: param.value })),
        link: item.link,
        isRead: item.isRead,
        createdAt: item.createdAt,
    })),
    unreadCount: result.unreadCount,
    nextCursor: result.next,
})
