import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The model-call quota of the learner for the UTC day. */
export class AgentQuotaType {
    /** The most calls per day. */
    @Field(() => Int)
    limit!: number

    /** The calls made today. */
    @Field(() => Int)
    used!: number

    /** The calls left today. */
    @Field(() => Int)
    remaining!: number

    /** Whether no call is left, the hard-stop state. */
    @Field(() => Boolean)
    exhausted!: boolean

    /** The next UTC midnight, an ISO instant. */
    @Field(() => String)
    resetsAt!: string
}
