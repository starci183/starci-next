import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** What the learner's online device was sent. */
export class LessonRunRequestedType {
    /** The name of the device the manifest went to. */
    @Field(() => String)
    device!: string

    /** The command the device shows and asks the learner to confirm. */
    @Field(() => String)
    command!: string

    /** The signed manifest id. */
    @Field(() => String)
    manifestId!: string
}
