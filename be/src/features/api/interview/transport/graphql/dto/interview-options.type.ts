import { Field, ObjectType } from "@nestjs/graphql"
import { InterviewTrackType } from "./interview-track.type"
import { InterviewBankOptionType } from "./interview-bank-option.type"
import { InterviewAccessType } from "./interview-access.type"
import { InterviewHistoryItemType } from "./interview-history-item.type"

@ObjectType()
/** The options of the interview home. */
export class InterviewOptionsType {
    /** The tracks. */
    @Field(() => [InterviewTrackType])
    tracks!: ReadonlyArray<InterviewTrackType>

    /** The banks. */
    @Field(() => [InterviewBankOptionType])
    banks!: ReadonlyArray<InterviewBankOptionType>

    /** The access of the learner. */
    @Field(() => InterviewAccessType)
    access!: InterviewAccessType

    /** The session in progress. */
    @Field(() => InterviewHistoryItemType, { nullable: true })
    active!: InterviewHistoryItemType | null
}
