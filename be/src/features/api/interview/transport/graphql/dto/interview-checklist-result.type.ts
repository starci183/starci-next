import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One checklist item graded; released only with the scorecard. */
export class InterviewChecklistResultType {
    /** What a strong answer says. */
    @Field(() => String)
    text!: string

    /** The dimension. */
    @Field(() => String)
    dimension!: string

    /** Whether it is critical. */
    @Field(() => Boolean)
    critical!: boolean

    /** The points it gives. */
    @Field(() => Int)
    scoreBand!: number

    /** Whether the answer showed it. */
    @Field(() => Boolean)
    hit!: boolean

    /** The learner's own words that show it. */
    @Field(() => String)
    evidenceQuote!: string
}
