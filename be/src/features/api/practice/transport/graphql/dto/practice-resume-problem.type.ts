import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The problem the learner submitted most recently and has not got accepted. */
export class PracticeResumeProblemType {
    /** The problem slug. */
    @Field(() => String)
    slug!: string

    /** The title in the asked locale. */
    @Field(() => String)
    title!: string

    /** The pattern id. */
    @Field(() => String)
    patternId!: string

    /** The title of the pattern in the asked locale. */
    @Field(() => String)
    patternTitle!: string

    /** How many graded submits the learner made on it. */
    @Field(() => Int)
    attempts!: number

    /** The verdict of the latest graded submit, as a submission verdict name such as WRONG_ANSWER. */
    @Field(() => String)
    lastVerdict!: string

    /** The index of the first test summary the latest submit failed, or null when none is named. */
    @Field(() => Int, { nullable: true })
    failedTestIndex!: number | null
}
