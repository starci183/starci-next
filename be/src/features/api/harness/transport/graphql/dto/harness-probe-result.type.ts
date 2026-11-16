import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One doctor probe with the newest result the learner CLI uploaded. */
export class HarnessProbeResultType {
    /** The probe id. */
    @Field(() => String)
    id!: string

    /** The position. */
    @Field(() => Int)
    order!: number

    /** The title. */
    @Field(() => String)
    title!: string

    /** The guide slug that lists the probe, or null. */
    @Field(() => String, { nullable: true })
    guide!: string | null

    /** The hint of the probe, or null. */
    @Field(() => String, { nullable: true })
    fix!: string | null

    /** PASSED, FAILED, SKIPPED, INVALID or NOT_RUN. */
    @Field(() => String)
    status!: string

    /** The fail code, or null. */
    @Field(() => String, { nullable: true })
    reason!: string | null

    /** When it ran, or null. */
    @Field(() => String, { nullable: true })
    at!: string | null
}
