import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A mindset concept every track is graded on. */
export class AgentLabConceptType {
    /** The concept id. */
    @Field(() => String)
    id!: string

    /** The short name in the asked locale. */
    @Field(() => String)
    label!: string

    /** What counts as evidence, in the asked locale. */
    @Field(() => String)
    evidence!: string

    /** Whether the labs of this concept open without Premium. */
    @Field(() => Boolean)
    free!: boolean
}
