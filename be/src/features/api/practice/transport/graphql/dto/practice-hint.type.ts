import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One step of the hint ladder, written by the teacher. */
export class PracticeHintType {
    /** The step, 1 to 3. */
    @Field(() => Int)
    step!: number

    /** The title of the step. */
    @Field(() => String)
    title!: string

    /** The prose of the step in markdown. */
    @Field(() => String)
    markdown!: string
}
