import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One check of the done outcome of a path. */
export class OutcomeCheckType {
    /** The check in the asked locale. */
    @Field(() => String)
    text!: string

    /** True when only the learner can report it. */
    @Field(() => Boolean)
    selfReported!: boolean
}
