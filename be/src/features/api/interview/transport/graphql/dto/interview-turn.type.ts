import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One turn of an interview as the learner reads it. */
export class InterviewTurnType {
    /** The turn id. */
    @Field(() => String)
    turnId!: string

    /** The question position. */
    @Field(() => Int)
    position!: number

    /** interviewer or candidate. */
    @Field(() => String)
    role!: string

    /** prompt, followUp, probe, hint, answer, skip or done. */
    @Field(() => String)
    kind!: string

    /** The text. */
    @Field(() => String)
    content!: string

    /** The revision of a candidate answer. */
    @Field(() => Int, { nullable: true })
    revision!: number | null

    /** When the turn was stored. */
    @Field(() => String)
    createdAt!: string
}
