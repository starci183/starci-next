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
/** A Mermaid figure and the one line that says where to look. */
export class LessonOpenerFigureType {
    /** The Mermaid text. */
    @Field(() => String)
    diagram!: string

    /** Where to look. */
    @Field(() => String)
    caption!: string
}

@ObjectType()
/** One term of the lesson's glossary. */
export class LessonGlossaryEntryType {
    @Field(() => String)
    term!: string

    /** The one-line definition. */
    @Field(() => String)
    definition!: string
}

@ObjectType()
/** The closing of the opener (Hết đêm), read after the last question is solved. */
export class LessonOpenerClosingType {
    /** The closing paragraphs, split by a blank line. */
    @Field(() => String)
    body!: string

    /** The one question to the reader. */
    @Field(() => String)
    question!: string
}

@ObjectType()
/** The situation the opener tells, shown above the first question. */
export class LessonOpenerStoryType {
    /** The situation in a few words. */
    @Field(() => String)
    title!: string

    /** Bối cảnh: the situation, paragraphs split by a blank line. */
    @Field(() => String)
    body!: string

    /** The opening hook, the lede under the title, or null. */
    @Field(() => String, { nullable: true })
    hook!: string | null

    /** The closing after the last question, or null. */
    @Field(() => LessonOpenerClosingType, { nullable: true })
    closing!: LessonOpenerClosingType | null

    /** The business line (domain, kind of shop, your role); empty when the story names none. */
    @Field(() => String)
    company!: string

    /** The key figures of the situation. */
    @Field(() => [String])
    facts!: ReadonlyArray<string>

    /** The whole system, drawn once at the top of Mở đầu, or null. */
    @Field(() => LessonOpenerFigureType, { nullable: true })
    system!: LessonOpenerFigureType | null

    /** The lesson's glossary. */
    @Field(() => [LessonGlossaryEntryType])
    glossary!: ReadonlyArray<LessonGlossaryEntryType>
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

    /** A few words naming the moment, the line of the question on the lesson rail, or null. */
    @Field(() => String, { nullable: true })
    title!: string | null

    /** What is seen going wrong (Triệu chứng), or null. */
    @Field(() => String, { nullable: true })
    symptom!: string | null

    /** What the interviewer wants to know: the skill the question tests, or null. */
    @Field(() => String, { nullable: true })
    probe!: string | null

    /** The system the question touches, as a Mermaid flowchart drawn before the answer, or null. */
    @Field(() => String, { nullable: true })
    contextDiagram!: string | null

    /** The one line that says which parts the flowchart touches, or null. */
    @Field(() => String, { nullable: true })
    contextCaption!: string | null

    /** The situation in plain business words, as numbered steps. */
    @Field(() => [String])
    steps!: ReadonlyArray<string>

    /** The condition the right option must meet, the line under the question, or null. */
    @Field(() => String, { nullable: true })
    condition!: string | null

    /** Chi tiết kỹ thuật (folded), or null. */
    @Field(() => String, { nullable: true })
    technical!: string | null

    /** The activity id of the written explanation the question asks (challenge.<id>.<question>.written), or null. */
    @Field(() => String, { nullable: true })
    writtenActivityId!: string | null
}
