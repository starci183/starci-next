import { Field, ObjectType } from "@nestjs/graphql"
import { LessonSimulationActionType } from "./lesson-simulation-action.type"
import { LessonSimulationStateType } from "./lesson-simulation-state.type"
import { LessonSimulationTransitionType } from "./lesson-simulation-transition.type"

@ObjectType()
/** A simulation the learner plays. */
export class LessonSimulationType {
    /** The state to start in. */
    @Field(() => String)
    initialStateId!: string

    /** The question asked at the goal. */
    @Field(() => String)
    debriefQuestion!: string

    /** Every state. */
    @Field(() => [LessonSimulationStateType])
    states!: ReadonlyArray<LessonSimulationStateType>

    /** Every action. */
    @Field(() => [LessonSimulationActionType])
    actions!: ReadonlyArray<LessonSimulationActionType>

    /** Every edge. */
    @Field(() => [LessonSimulationTransitionType])
    transitions!: ReadonlyArray<LessonSimulationTransitionType>
}
