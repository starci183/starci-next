import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A layer over the shards; it has no streak. */
export class HubLayerType {
    /** mission, profile or hiring. */
    @Field(() => String)
    id!: string

    /** The name in the asked locale. */
    @Field(() => String)
    label!: string

    /** Where it lives. */
    @Field(() => String)
    route!: string
}
