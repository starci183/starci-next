import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The outcome path the learner follows. */
export class ProfileGoalType {
    /** The path id. */
    @Field(() => String)
    pathId!: string

    /** The path title in the asked locale. */
    @Field(() => String)
    title!: string
}
