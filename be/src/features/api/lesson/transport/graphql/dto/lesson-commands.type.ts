import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The test commands per platform. */
export class LessonCommandsType {
    /** The Windows command, or null. */
    @Field(() => String, { nullable: true })
    windows!: string | null

    /** The Unix command, or null. */
    @Field(() => String, { nullable: true })
    unix!: string | null
}
