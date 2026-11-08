import { Field, Float, ObjectType } from "@nestjs/graphql"
import { RecallRecallRateType } from "./recall-recall-rate.type"

@ObjectType()
/** The review statistics of a learner. */
export class RecallStatsType {
    /** The active days a week. */
    @Field(() => Float)
    activeDaysPerWeek!: number

    /** The recall rate by review number. */
    @Field(() => [RecallRecallRateType])
    recallRateByReview!: ReadonlyArray<RecallRecallRateType>
}
