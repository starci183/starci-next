import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One option of a graded choice, released after the submit. */
export class LessonAttemptOptionResultType {
    /** The option id. */
    @Field(() => String)
    optionId!: string

    /** Whether the option is the right one. */
    @Field(() => Boolean)
    isCorrect!: boolean

    /** Whether the learner picked it. */
    @Field(() => Boolean)
    selected!: boolean

    /** Why the option is right or wrong. */
    @Field(() => String)
    explanation!: string
}
