import { Field, ID, ObjectType } from "@nestjs/graphql"
import { NotificationParamType } from "./notification-param.type"

@ObjectType("Notification")
/** One notification of the learner: a kind and params, never message text. */
export class NotificationType {
    /** The notification id. */
    @Field(() => ID)
    id!: string

    /** The kind the front end maps to its i18n keys. */
    @Field(() => String)
    kind!: string

    /** The facts for the text, ordered by key. */
    @Field(() => [NotificationParamType])
    params!: Array<NotificationParamType>

    /** The in-app path the notification opens; null when it opens nothing. */
    @Field(() => String, { nullable: true })
    link!: string | null

    /** Whether the learner has read it. */
    @Field(() => Boolean)
    isRead!: boolean

    /** When it was created, an ISO instant. */
    @Field(() => String)
    createdAt!: string
}
