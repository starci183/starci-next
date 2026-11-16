import { Field, Int, ObjectType } from "@nestjs/graphql"
import { HarnessE2eType } from "./harness-e2e.type"
import { HarnessTextType } from "./harness-text.type"

@ObjectType()
/** One stage of a build with its state, e2e tests and guide steps. */
export class HarnessStageType {
    /** The stage id. */
    @Field(() => String)
    id!: string

    /** The position. */
    @Field(() => Int)
    order!: number

    /** The title. */
    @Field(() => String)
    title!: string

    /** The summary. */
    @Field(() => String)
    summary!: string

    /** NONE, PRACTISING or PROVED. */
    @Field(() => String)
    state!: string

    /** The e2e tests. */
    @Field(() => [HarnessE2eType])
    e2e!: Array<HarnessE2eType>

    /** The guide steps. */
    @Field(() => [HarnessTextType])
    steps!: Array<HarnessTextType>

    /** When the newest relayed result was stored, or null. */
    @Field(() => String, { nullable: true })
    lastRunAt!: string | null

    /** The newest failure line, or null. */
    @Field(() => String, { nullable: true })
    lastWhy!: string | null
}
