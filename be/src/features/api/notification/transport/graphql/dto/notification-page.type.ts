import { Field, Int, ObjectType } from "@nestjs/graphql"
import { NotificationType } from "./notification.type"

@ObjectType("NotificationPage")
/** One page of the learner's notifications, newest first. */
export class NotificationPageType {
    /** The notifications of the page. */
    @Field(() => [NotificationType])
    items!: Array<NotificationType>

    /** The notifications the learner has not read, across all pages. */
    @Field(() => Int)
    unreadCount!: number

    /** The cursor of the next page; null on the last page. */
    @Field(() => String, { nullable: true })
    nextCursor!: string | null
}
