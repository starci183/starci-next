import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One drawn question: prompt material only, never grading data. */
export class InterviewQuestionType {
    /** The position. */
    @Field(() => Int)
    position!: number

    /** technical or behavioral. */
    @Field(() => String)
    family!: string

    /** The tier. */
    @Field(() => String)
    tier!: string

    /** The kind. */
    @Field(() => String)
    kind!: string

    /** The title of the bank. */
    @Field(() => String)
    bankTitle!: string

    /** The question. */
    @Field(() => String)
    prompt!: string

    /** The code to read. */
    @Field(() => String, { nullable: true })
    givenCode!: string | null

    /** The diagram to read. */
    @Field(() => String, { nullable: true })
    diagram!: string | null

    /** The code language of the body. */
    @Field(() => String)
    bodyLanguage!: string

    /** How many hints the question has. */
    @Field(() => Int)
    hintCount!: number
}
