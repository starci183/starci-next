import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The daily goal and what is done today. */
export class RecallGoalType {
    /** The items a day the learner set. */
    @Field(() => Int)
    daily!: number

    /** The items reviewed today. */
    @Field(() => Int)
    done!: number
}
