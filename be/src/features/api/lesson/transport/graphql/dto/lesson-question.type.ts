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
/** One development of the opener story: when it happens and what happens. */
export class LessonOpenerEventType {
    /** When it happens, as the timeline labels it (`21:03`). */
    @Field(() => String)
    at!: string

    /** What happens. */
    @Field(() => String)
    text!: string
}

@ObjectType()
/** The situation the opener tells, shown above the questions. */
export class LessonOpenerStoryType {
    /** The situation in a few words. */
    @Field(() => String)
    title!: string

    /** The situation. */
    @Field(() => String)
    body!: string
}

@ObjectType()
/** A multiple-choice question before a submit: no right index, no explanation and no insight. */
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

    /** The development of the opener story this question adds, or null. */
    @Field(() => LessonOpenerEventType, { nullable: true })
    event!: LessonOpenerEventType | null

    /** The activity id of the written explanation the question asks (challenge.<id>.<question>.written), or null. */
    @Field(() => String, { nullable: true })
    writtenActivityId!: string | null
}
