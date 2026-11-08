import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The model that graded a session. */
export class InterviewGradedByType {
    /** The routing profile. */
    @Field(() => String)
    profile!: string

    /** The model id. */
    @Field(() => String)
    model!: string

    /** Whether a fallback answered. */
    @Field(() => Boolean)
    usedFallback!: boolean
}
