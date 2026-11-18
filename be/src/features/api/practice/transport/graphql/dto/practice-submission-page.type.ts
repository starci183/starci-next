import { Field, ObjectType } from "@nestjs/graphql"
import { PracticeSubmissionItemType } from "./practice-submission-item.type"

@ObjectType()
/** One page of the graded submits of a learner in one pattern, newest first. */
export class PracticeSubmissionPageType {
    /** The submits of the page. */
    @Field(() => [PracticeSubmissionItemType])
    items!: ReadonlyArray<PracticeSubmissionItemType>

    /** The cursor of the next page; null on the last page. */
    @Field(() => String, { nullable: true })
    nextCursor!: string | null
}
