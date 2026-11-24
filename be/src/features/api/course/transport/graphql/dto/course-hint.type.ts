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
