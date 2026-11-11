import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One action of a simulation. */
export class LessonSimulationActionType {
    /** The stable id. */
    @Field(() => String)
    id!: string

    /** The action text. */
    @Field(() => String)
    label!: string

    /** True when the action opens a branch worth trying. */
    @Field(() => Boolean)
    isBranch!: boolean
}
