import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One evidence slot of a concept. */
export class ProjectSlotType {
    /** test, e2e, probe or code-read. */
    @Field(() => String)
    slot!: string

    /** Whether the concept needs this slot or another of its group. */
    @Field(() => Boolean)
    required!: boolean

    /** pass, fail or pending. */
    @Field(() => String)
    state!: string

    /** Whether the latest passing result is proof and not only practice. */
    @Field(() => Boolean)
    proof!: boolean

    /** relay, ci, server-probe or ai; null before any result. */
    @Field(() => String, { nullable: true })
    source!: string | null

    /** The test name, e2e file, probe id or code location of the latest result. */
    @Field(() => String, { nullable: true })
    ref!: string | null

    /** When the latest result was produced, as an ISO 8601 instant. */
    @Field(() => String, { nullable: true })
    at!: string | null
}
