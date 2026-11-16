import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One piece of proof under a CV line. */
export class ProjectCvEvidenceLinkType {
    /** ci-run, probe-run or code-read. */
    @Field(() => String)
    kind!: string

    /** The run id, or the concept for a code read. */
    @Field(() => String)
    ref!: string

    /** signed-ci, server-probe or graded-session. */
    @Field(() => String)
    proofForm!: string

    /** When the proof was produced, as an ISO 8601 instant. */
    @Field(() => String)
    at!: string
}
