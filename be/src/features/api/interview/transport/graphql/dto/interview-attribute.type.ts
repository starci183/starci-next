import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The score of one attribute. */
export class InterviewAttributeType {
    /** The attribute. */
    @Field(() => String)
    key!: string

    /** 0 to 100. */
    @Field(() => Int)
    score!: number
}
