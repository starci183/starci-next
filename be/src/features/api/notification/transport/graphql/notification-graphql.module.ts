import { Module } from "@nestjs/common"
import { NotificationApiModule } from "../../notification.module"
import { GetMyNotificationsResolver } from "./get-my-notifications.resolver"
import { MarkNotificationsReadResolver } from "./mark-notifications-read.resolver"
import { ConfigurableModuleClass } from "./notification-graphql.module-definition"

@Module({
    imports: [NotificationApiModule.register({})],
    providers: [GetMyNotificationsResolver, MarkNotificationsReadResolver],
})
/** The GraphQL transport of the notification feature: the signed-in learner's inbox page and mark-read doors. */
export class NotificationGraphqlModule extends ConfigurableModuleClass {}
