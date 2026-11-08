import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The result of a cloze check. */
export class RecallClozeResultType {
    /** Whether the picked choice is the hidden term. */
    @Field(() => Boolean)
    correct!: boolean
}
