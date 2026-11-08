import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** An abandoned session. */
export class InterviewAbandonType {
    /** The session id. */
    @Field(() => String)
    sessionId!: string

    /** abandoned. */
    @Field(() => String)
    status!: string
}
