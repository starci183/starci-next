import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** What an upload answers: the client event id and that it is stored. */
export class RelayUploadType {
    /** The client event id. */
    @Field(() => String)
    eventId!: string

    /** True once stored, a resend included. */
    @Field(() => Boolean)
    accepted!: boolean
}
