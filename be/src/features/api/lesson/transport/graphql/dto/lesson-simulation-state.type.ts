import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One state of a simulation. */
export class LessonSimulationStateType {
    /** The stable id. */
    @Field(() => String)
    id!: string

    /** The short name. */
    @Field(() => String)
    label!: string

    /** What the learner observes. */
    @Field(() => String)
    observation!: string

    /** Whether the state is a goal. */
    @Field(() => Boolean)
    isSuccess!: boolean
}
