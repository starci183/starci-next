import { Field, ObjectType } from "@nestjs/graphql"
import { LessonSimulationFactType } from "./lesson-simulation-fact.type"

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

    /** The counters shown with the state; empty when the state has none. */
    @Field(() => [LessonSimulationFactType])
    facts!: ReadonlyArray<LessonSimulationFactType>
}
