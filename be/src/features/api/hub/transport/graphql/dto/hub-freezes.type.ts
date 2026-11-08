import { Field, ObjectType, Int } from "@nestjs/graphql"

@ObjectType()
/** The freezes a learner holds. */
export class HubFreezesType {
    /** The freezes held. */
    @Field(() => Int)
    held!: number
}
