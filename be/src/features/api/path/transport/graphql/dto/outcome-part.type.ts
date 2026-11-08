import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A part a path uses, for the chips of its card. */
export class OutcomePartType {
    /** The part id. */
    @Field(() => String)
    part!: string

    /** The part name in the asked locale. */
    @Field(() => String)
    label!: string
}
