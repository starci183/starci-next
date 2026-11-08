import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The daily goal after it was set. */
export class RecallGoalSetType {
    /** The items a day. */
    @Field(() => Int)
    daily!: number
}
