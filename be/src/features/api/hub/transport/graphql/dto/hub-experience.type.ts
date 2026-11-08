import { Field, ObjectType, Int } from "@nestjs/graphql"

@ObjectType()
/** The experience items of one shard. */
export class HubExperienceType {
    /** Items the teacher verified. */
    @Field(() => Int)
    verified!: number

    /** Items waiting for the teacher. */
    @Field(() => Int)
    pending!: number
}
