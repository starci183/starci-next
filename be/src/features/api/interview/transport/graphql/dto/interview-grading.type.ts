import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** Where a grading stands. */
export class InterviewGradingType {
    /** The session id. */
    @Field(() => String)
    sessionId!: string

    /** The status. */
    @Field(() => String)
    status!: string

    /** The code of a failed grading. */
    @Field(() => String, { nullable: true })
    failureCode!: string | null
}
