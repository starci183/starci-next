import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One part of an Essentials lesson and whether the plan opens it. */
export class ProgressPartType {
    /** essence, source, script or apply. */
    @Field(() => String)
    part!: string

    /** The position, from 1. */
    @Field(() => Int)
    order!: number

    /** unlocked or locked. */
    @Field(() => String)
    access!: string
}
