import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One STAR dimension graded. */
export class InterviewDimensionResultType {
    /** The dimension. */
    @Field(() => String)
    key!: string

    /** What good looks like. */
    @Field(() => String)
    text!: string

    /** 0 to 4. */
    @Field(() => Int)
    level!: number

    /** The learner's own words. */
    @Field(() => String)
    evidenceQuote!: string
}
