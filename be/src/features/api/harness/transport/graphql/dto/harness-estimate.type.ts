import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The cost estimate inputs of a trap. */
export class HarnessEstimateType {
    /** The expected turns. */
    @Field(() => Int)
    turns!: number

    /** The expected output tokens per turn. */
    @Field(() => Int)
    outputTokensPerTurn!: number
}
