import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One live bank. */
export class InterviewBankOptionType {
    /** The bank id. */
    @Field(() => String)
    bankId!: string

    /** The family. */
    @Field(() => String)
    family!: string

    /** The title. */
    @Field(() => String)
    title!: string

    /** The difficulty. */
    @Field(() => String)
    difficulty!: string

    /** Its tiers. */
    @Field(() => [String])
    tiers!: ReadonlyArray<string>

    /** Its code languages. */
    @Field(() => [String])
    languages!: ReadonlyArray<string>

    /** Its questions. */
    @Field(() => Int)
    questionCount!: number

    /** Its free questions. */
    @Field(() => Int)
    freeQuestionCount!: number
}
