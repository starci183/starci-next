import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetMyNotificationsQuery } from "../../application/get-my-notifications.query"
import { MyNotificationsInput } from "./dto/my-notifications.input"
import { NotificationPageType } from "./dto/notification-page.type"
import { toGetMyNotificationsParams, toNotificationPageType } from "./get-my-notifications.mapper"

@Resolver()
/** GraphQL door of myNotifications: a signed-in learner reads a page of their own notifications. */
export class GetMyNotificationsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads a page of the caller notifications, newest first, with the unread count across all pages. */
    @Query(() => NotificationPageType, { name: "myNotifications" })
    async myNotifications(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input", { type: () => MyNotificationsInput, nullable: true, defaultValue: {} })
        input: MyNotificationsInput,
    ): Promise<NotificationPageType> {
        const result = await this.queryBus.execute(
            new GetMyNotificationsQuery(toGetMyNotificationsParams(identity, input)),
        )
        return toNotificationPageType(result)
    }
}
