import { Field, ObjectType } from "@nestjs/graphql"
import { ProjectFactType } from "./project-fact.type"

@ObjectType()
/** The result of one probe of a run. */
export class ProjectProbeResultType {
    /** The probe. */
    @Field(() => String)
    probeId!: string

    /** The concept it was aimed for. */
    @Field(() => String, { nullable: true })
    conceptId!: string | null

    /** Whether it passed. */
    @Field(() => Boolean)
    passed!: boolean

    /** The stable reason code. */
    @Field(() => String)
    reason!: string

    /** The facts of the result. */
    @Field(() => [ProjectFactType])
    facts!: ReadonlyArray<ProjectFactType>
}
