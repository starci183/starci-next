import { Field, ObjectType } from "@nestjs/graphql"
import { InterviewTurnType } from "./interview-turn.type"

@ObjectType()
/** What storing an answer gave back. */
export class InterviewAnswerType {
    /** The stored candidate turn. */
    @Field(() => InterviewTurnType)
    saved!: InterviewTurnType

    /** The interviewer turn that followed. */
    @Field(() => InterviewTurnType, { nullable: true })
    next!: InterviewTurnType | null

    /** The session status. */
    @Field(() => String)
    status!: string

    /** The code of the failed interviewer step. */
    @Field(() => String, { nullable: true })
    failureCode!: string | null
}
