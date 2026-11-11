import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** Where the learner stands in one simulation activity, kept so a reload finds the same state. */
export class LessonProgressSimulationType {
    /** The simulation activity. */
    @Field(() => String)
    activityId!: string

    /** The state the learner is in now. */
    @Field(() => String)
    currentStateId!: string

    /** The actions of the current path, from the initial state. */
    @Field(() => [String])
    actionIds!: ReadonlyArray<string>

    /** Every transition ever taken, so a branch tried once stays tried. */
    @Field(() => [String])
    triedTransitionIds!: ReadonlyArray<string>

    /** When it last changed. */
    @Field(() => String)
    updatedAt!: string
}
