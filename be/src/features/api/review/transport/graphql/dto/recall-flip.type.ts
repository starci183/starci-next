import { Field, Int, ObjectType } from "@nestjs/graphql"
import { RecallIntervalsType } from "./recall-intervals.type"

@ObjectType()
/** The answer shown after a flip or a written answer, with the interval of each grade. */
export class RecallFlipType {
    /** The item id. */
    @Field(() => String)
    itemId!: string

    /** The revision a grade must carry. */
    @Field(() => Int)
    revision!: number

    /** The answer markdown, cloze terms in bold. */
    @Field(() => String)
    answer!: string

    /** The days per grade. */
    @Field(() => RecallIntervalsType)
    intervals!: RecallIntervalsType
}
