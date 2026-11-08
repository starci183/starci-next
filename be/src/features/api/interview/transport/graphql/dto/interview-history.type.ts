import { Field, ObjectType } from "@nestjs/graphql"
import { InterviewHistoryItemType } from "./interview-history-item.type"
import { InterviewTrendType } from "./interview-trend.type"

@ObjectType()
/** The history of a learner. */
export class InterviewHistoryType {
    /** Sessions, newest first. */
    @Field(() => [InterviewHistoryItemType])
    items!: ReadonlyArray<InterviewHistoryItemType>

    /** The trend per track and tier. */
    @Field(() => [InterviewTrendType])
    trend!: ReadonlyArray<InterviewTrendType>
}
