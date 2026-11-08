import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One edge of a simulation. */
export class LessonSimulationTransitionType {
    /** The stable id. */
    @Field(() => String)
    id!: string

    /** The state the action is taken in. */
    @Field(() => String)
    fromStateId!: string

    /** The action taken. */
    @Field(() => String)
    actionId!: string

    /** The state it leads to. */
    @Field(() => String)
    toStateId!: string
}
