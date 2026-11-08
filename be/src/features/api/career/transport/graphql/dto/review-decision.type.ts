import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One row of an item's audit trail. */
export class ReviewDecisionType {
    /** What was done. */
    @Field(() => String)
    action!: string

    /** learner, REVIEWER, TEACHER or system. */
    @Field(() => String)
    actorRole!: string

    /** The state before, or null. */
    @Field(() => String, { nullable: true })
    fromState!: string | null

    /** The state after. */
    @Field(() => String)
    toState!: string

    /** The note of a return or revoke, or null. */
    @Field(() => String, { nullable: true })
    note!: string | null

    /** When. */
    @Field(() => String)
    at!: string
}
