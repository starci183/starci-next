import { Field, ObjectType } from "@nestjs/graphql"
import { OutcomeStepType } from "./outcome-step.type"

@ObjectType()
/** One stage of an outcome path: understand, remember, solve, build, build-ai, interview or prove. */
export class OutcomeStageType {
    /** The stage id. */
    @Field(() => String)
    stageId!: string

    /** The stage name in the asked locale. */
    @Field(() => String)
    title!: string

    /** The steps of the stage. */
    @Field(() => [OutcomeStepType])
    steps!: Array<OutcomeStepType>
}
