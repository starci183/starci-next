import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The hint level the learner just opened. */
export class CourseHintOpenedType {
    /** The case id. */
    @Field(() => String)
    caseId!: string

    /** The level, 1 to 3. */
    @Field(() => Int)
    level!: number

    /** The hint text. */
    @Field(() => String)
    text!: string
}

@ObjectType()
/** The solution the learner just opened: its case, and whether its fix is revealed now. */
export class CourseSolutionOpenedType {
    /** The case id. */
    @Field(() => String)
    caseId!: string

    /** Whether the case's before-and-after block is revealed (true once the press is stored). */
    @Field(() => Boolean)
    revealed!: boolean
}
