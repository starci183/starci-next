import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A choice of a question as the learner sees it before a submit: the words only. */
export class LessonChoiceType {
    /** The option id a submit names (`c0`, `c1`...). */
    @Field(() => String)
    id!: string

    /** The choice text. */
    @Field(() => String)
    label!: string
}

@ObjectType()
/** A multiple-choice question before a submit: no right index and no explanation. */
export class LessonQuestionType {
    /** The question id. */
    @Field(() => String)
    id!: string

    /** The activity id a submit names. */
    @Field(() => String)
    activityId!: string

    /** The question. */
    @Field(() => String)
    prompt!: string

    /** The choices in order. */
    @Field(() => [LessonChoiceType])
    choices!: ReadonlyArray<LessonChoiceType>

    /** The article section to read closely when the answer is wrong, or null. */
    @Field(() => String, { nullable: true })
    sectionId!: string | null

    /** The heading number inside that section (`2.2`), or null. */
    @Field(() => String, { nullable: true })
    sectionRef!: string | null

    /** The scenario that shows the answer, or null. */
    @Field(() => String, { nullable: true })
    scenarioId!: string | null
}
