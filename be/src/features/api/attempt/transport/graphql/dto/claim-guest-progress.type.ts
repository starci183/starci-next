import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** What merging the progress of a guest into the account did. */
export class ClaimGuestProgressType {
    /** The answers stored. */
    @Field(() => Int)
    answersClaimed!: number

    /** The answers left out: already answered, not free, or no longer in the lesson. */
    @Field(() => Int)
    answersSkipped!: number

    /** The sections marked as read. */
    @Field(() => Int)
    sectionsClaimed!: number

    /** The sections left out. */
    @Field(() => Int)
    sectionsSkipped!: number
}
