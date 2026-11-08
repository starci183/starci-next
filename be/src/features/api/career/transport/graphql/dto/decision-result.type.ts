import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** What one decision of a batch did. */
export class DecisionResultType {
    /** The item. */
    @Field(() => String)
    itemId!: string

    /** The new state, or null when refused. */
    @Field(() => String, { nullable: true })
    state!: string | null

    /** The stable code of the refusal, or null. */
    @Field(() => String, { nullable: true })
    refusal!: string | null
}
