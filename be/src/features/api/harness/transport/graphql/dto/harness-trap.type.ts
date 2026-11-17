import { Field, Int, ObjectType } from "@nestjs/graphql"
import { HarnessBudgetType } from "./harness-budget.type"
import { HarnessTrapShortcutType } from "./harness-trap-shortcut.type"
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

    /** What the tool is asked to do. */
    @Field(() => String)
    brief!: string

    /** The prompt sent to the learner own agent. */
    @Field(() => String)
    prompt!: string

    /** The tools it runs with. */
    @Field(() => [String])
    tools!: Array<string>

    /** The budget of one run. */
    @Field(() => HarnessBudgetType)
    budget!: HarnessBudgetType

    /** The shortcuts the observer flags. */
    @Field(() => [HarnessTrapShortcutType])
    shortcuts!: Array<HarnessTrapShortcutType>

    /** The newest result, or null. */
    @Field(() => HarnessTrialResultType, { nullable: true })
    last!: HarnessTrialResultType | null
}
