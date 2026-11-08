import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A concept a learner proved in a project. */
export class ProjectProvedConceptType {
    /** The project. */
    @Field(() => String)
    projectId!: string

    /** The concept. */
    @Field(() => String)
    conceptId!: string

    /** When it was first proved, as an ISO 8601 instant. */
    @Field(() => String)
    provedAt!: string
}
