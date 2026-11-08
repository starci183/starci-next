import { Field, ObjectType } from "@nestjs/graphql"
import { ProjectFactType } from "./project-fact.type"

@ObjectType()
/** The latest failing result of a concept, with the question the AI teacher asks. */
export class ProjectFailureType {
    /** The slot that failed. */
    @Field(() => String)
    slot!: string

    /** The probe that failed. */
    @Field(() => String, { nullable: true })
    probeId!: string | null

    /** The stable reason code. */
    @Field(() => String)
    reason!: string

    /** The facts of the failure. */
    @Field(() => [ProjectFactType])
    facts!: ReadonlyArray<ProjectFactType>

    /** The Socratic question, in the locale of the request. */
    @Field(() => String)
    question!: string
}
