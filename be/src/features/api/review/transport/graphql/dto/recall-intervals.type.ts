import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The days until the next review for each grade. */
export class RecallIntervalsType {
    /** Again; 0 means the end of the session of today. */
    @Field(() => Int)
    again!: number

    /** Hard. */
    @Field(() => Int)
    hard!: number

    /** Good. */
    @Field(() => Int)
    good!: number

    /** Easy. */
    @Field(() => Int)
    easy!: number
}
