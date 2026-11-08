import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType("NotificationParam")
/** One fact of a notification, for the front end to fill its i18n text. */
export class NotificationParamType {
    /** The param key. */
    @Field(() => String)
    key!: string

    /** The param value as text. */
    @Field(() => String)
    value!: string
}
