import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One tool key a build needs: the learner puts one of the names in their own .env. */
export class HarnessKeyNeedType {
    /** The need id. */
    @Field(() => String)
    id!: string

    /** The environment names, any one is enough. */
    @Field(() => [String])
    anyOf!: Array<string>

    /** A note, or null. */
    @Field(() => String, { nullable: true })
    note!: string | null
}
