import { Field, Int, ObjectType } from "@nestjs/graphql"
import { OutcomeCheckType } from "./outcome-check.type"
import { OutcomePartType } from "./outcome-part.type"
import { OutcomeStageType } from "./outcome-stage.type"

@ObjectType()
/** One outcome path: its promise, its done outcome and the stages that string the parts into it. */
export class OutcomePathType {
    /** The path id: founder, ai-engineer, backend-fullstack, devops-sre or system-design-senior. */
    @Field(() => String)
    pathId!: string

    /** build, agent or job. */
    @Field(() => String)
    kind!: string

    /** The name in the asked locale. */
    @Field(() => String)
    title!: string

    /** The promise in the asked locale. */
    @Field(() => String)
    pitch!: string

    /** The done outcome in the asked locale. */
    @Field(() => String)
    done!: string

    /** The checks of the done outcome. */
    @Field(() => [OutcomeCheckType])
    checks!: Array<OutcomeCheckType>

    /** Rough weeks from start to done. */
    @Field(() => Int)
    weeks!: number

    /** How many steps the path has. */
    @Field(() => Int)
    stepCount!: number

    /** The parts the path uses. */
    @Field(() => [OutcomePartType])
    parts!: Array<OutcomePartType>

    /** The stages with their steps. */
    @Field(() => [OutcomeStageType])
    stages!: Array<OutcomeStageType>
}
