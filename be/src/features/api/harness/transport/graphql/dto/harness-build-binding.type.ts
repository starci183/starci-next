import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The repository a build is now bound to. */
export class HarnessBuildBindingType {
    /** The build. */
    @Field(() => String)
    buildId!: string

    /** The bound GitHub repository, owner/name. */
    @Field(() => String)
    repository!: string

    /** The id to put in the workflow as STARCI_HARNESS_BINDING. */
    @Field(() => String)
    bindingId!: string

    /** The audience the workflow must request its OIDC token for. */
    @Field(() => String)
    audience!: string
}
