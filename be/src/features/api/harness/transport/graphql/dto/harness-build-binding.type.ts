import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The project a build is now bound to. */
export class HarnessBuildBindingType {
    /** The build. */
    @Field(() => String)
    buildId!: string

    /** The bound project. */
    @Field(() => String)
    projectId!: string
}
