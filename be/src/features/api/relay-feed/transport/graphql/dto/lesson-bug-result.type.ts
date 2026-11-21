import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One Tìm sạn test with the learner's newest relayed run and what it earned; practice, never proof. */
export class LessonBugResultType {
    /** The test id. */
    @Field(() => String)
    testId!: string

    /** none, running, passed or failed. */
    @Field(() => String)
    status!: string

    /** True for the final test while another test of the pack is not green. */
    @Field(() => Boolean)
    isLocked!: boolean

    /** When the newest run was stored, ISO 8601, or null. */
    @Field(() => String, { nullable: true })
    at!: string | null

    /** What the newest red run measured, or null. */
    @Field(() => String, { nullable: true })
    received!: string | null

    /** The output tail of the newest run, or null. */
    @Field(() => String, { nullable: true })
    output!: string | null

    /** "Vì sao giờ đúng", only after a green run. */
    @Field(() => String, { nullable: true })
    pass!: string | null

    /** "Vì sao chưa pass", only after a red run. */
    @Field(() => String, { nullable: true })
    fail!: string | null

    /** The hints opened so far, while the test is red. */
    @Field(() => [String])
    hints!: Array<string>

    /** How many hints the learner opened. */
    @Field(() => Int)
    hintsOpened!: number

    /** How many hints the test has. */
    @Field(() => Int)
    hintCount!: number
}
