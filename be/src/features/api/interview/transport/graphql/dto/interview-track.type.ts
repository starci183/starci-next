import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One outcome track. */
export class InterviewTrackType {
    /** The track id. */
    @Field(() => String)
    id!: string

    /** The title. */
    @Field(() => String)
    title!: string
}
