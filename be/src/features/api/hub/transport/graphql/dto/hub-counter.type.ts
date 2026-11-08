import { Field, ObjectType, Int } from "@nestjs/graphql"

@ObjectType()
/** The streak counter of one shard. */
export class HubCounterType {
    /** Days in a row. */
    @Field(() => Int)
    current!: number

    /** The best run. */
    @Field(() => Int)
    longest!: number
}
