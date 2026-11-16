import { Field, Int, ObjectType } from "@nestjs/graphql"
import { HarnessEstimateType } from "./harness-estimate.type"
import { HarnessTrialResultType } from "./harness-trial-result.type"

@ObjectType()
/** A trial trap with the newest result. */
export class HarnessTrapType {
    /** The trap id. */
    @Field(() => String)
    id!: string

    /** The position. */
    @Field(() => Int)
    order!: number

    /** The title. */
    @Field(() => String)
    title!: string

    /** The prompt sent to the learner own agent. */
    @Field(() => String)
    task!: string

    /** The tools it runs with. */
    @Field(() => [String])
    tools!: Array<string>

    /** The estimate, or null. */
    @Field(() => HarnessEstimateType, { nullable: true })
    estimate!: HarnessEstimateType | null

    /** The newest result, or null. */
    @Field(() => HarnessTrialResultType, { nullable: true })
    last!: HarnessTrialResultType | null
}
