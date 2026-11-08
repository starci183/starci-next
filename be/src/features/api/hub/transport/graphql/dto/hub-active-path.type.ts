import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The path the learner follows. */
export class HubActivePathType {
    /** The path id. */
    @Field(() => String)
    pathId!: string

    /** The path title. */
    @Field(() => String)
    title!: string

    /** The next steps, at most three. */
    @Field(() => [String])
    next!: Array<string>
}
