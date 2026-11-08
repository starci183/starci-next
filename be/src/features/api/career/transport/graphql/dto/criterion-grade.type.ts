import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The grade of one criterion. */
export class CriterionGradeType {
    /** The criterion. */
    @Field(() => String)
    criterion!: string

    /** The level reached, 0 to 2. */
    @Field(() => Int)
    level!: number

    /** What in the evidence shows it. */
    @Field(() => String)
    evidenceQuote!: string
}
