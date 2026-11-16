import { Field, ID, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One access token of the AI client of a learner. */
export class McpTokenType {
    /** The token id. */
    @Field(() => ID)
    id!: string

    /** The name the learner gave it. */
    @Field(() => String)
    name!: string

    /** The last four characters of the secret. */
    @Field(() => String)
    hint!: string

    /** The UTC instant it was created. */
    @Field(() => String)
    createdAt!: string

    /** The UTC instant a client last used it, or null. */
    @Field(() => String, { nullable: true })
    lastUsedAt!: string | null
}

@ObjectType()
/** A token just created: the secret shows here once and nowhere else. */
export class McpTokenIssuedType extends McpTokenType {
    /** The secret the learner pastes into the AI client. */
    @Field(() => String)
    secret!: string
}

@ObjectType()
/** Where the endpoint is and how many tokens a learner may hold. */
export class McpConnectInfoType {
    /** The endpoint address. */
    @Field(() => String)
    endpoint!: string

    /** How many tokens a learner may hold at once. */
    @Field(() => Int)
    tokenLimit!: number
}
