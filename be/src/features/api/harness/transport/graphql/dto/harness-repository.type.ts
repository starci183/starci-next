import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The GitHub repository whose attested CI proves a build; no Project and no Premium. */
export class HarnessRepositoryType {
    /** Whether a project is bound. */
    @Field(() => Boolean)
    bound!: boolean

    /** The bound GitHub repository, owner/name, or null. */
    @Field(() => String, { nullable: true })
    repository!: string | null

    /** The id the workflow sends as STARCI_HARNESS_BINDING, or null. */
    @Field(() => String, { nullable: true })
    bindingId!: string | null

    /** The audience the workflow must request its OIDC token for. */
    @Field(() => String)
    audience!: string
}
