import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** How a build installs and runs on the learner machine. */
export class HarnessRuntimeType {
    /** The project folder inside the pulled tree. */
    @Field(() => String)
    dir!: string

    /** The install command. */
    @Field(() => String)
    install!: string

    /** The e2e command. */
    @Field(() => String)
    e2e!: string

    /** The JUnit report path. */
    @Field(() => String)
    report!: string
}
