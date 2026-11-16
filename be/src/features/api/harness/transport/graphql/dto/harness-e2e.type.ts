import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One e2e test of a stage with its state. */
export class HarnessE2eType {
    /** The e2e id. */
    @Field(() => String)
    id!: string

    /** NONE, PRACTISING or PROVED. */
    @Field(() => String)
    state!: string

    /** Whether the newest result passed, or null. */
    @Field(() => Boolean, { nullable: true })
    passed!: boolean | null

    /** The commit of the newest result, or null. */
    @Field(() => String, { nullable: true })
    commit!: string | null

    /** When the newest result was stored, or null. */
    @Field(() => String, { nullable: true })
    at!: string | null
}
