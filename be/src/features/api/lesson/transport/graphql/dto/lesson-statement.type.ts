import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** An outcome or a prerequisite of a lesson. */
export class LessonStatementType {
    /** The stable id. */
    @Field(() => String)
    id!: string

    /** The text in the asked locale. */
    @Field(() => String)
    text!: string
}
