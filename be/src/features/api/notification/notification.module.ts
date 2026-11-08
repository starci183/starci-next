import { Module } from "@nestjs/common"
import { GetMyNotificationsHandler } from "./application/get-my-notifications.handler"
import { MarkNotificationsReadHandler } from "./application/mark-notifications-read.handler"
import { ConfigurableModuleClass } from "./notification.module-definition"

@Module({
    providers: [GetMyNotificationsHandler, MarkNotificationsReadHandler],
})
/** Application handlers of the notification feature: the learner's own inbox page and the mark-read command. */
export class NotificationApiModule extends ConfigurableModuleClass {}
