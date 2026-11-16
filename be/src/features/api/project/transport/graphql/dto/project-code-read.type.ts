import { Field, Float, ObjectType } from "@nestjs/graphql"
import { ProjectCodeReadCriterionType } from "./project-code-read-criterion.type"

@ObjectType()
/** The newest AI read of the code of a concept. */
export class ProjectCodeReadType {
    /** The project id. */
    @Field(() => String)
    projectId!: string

    /** The concept id. */
    @Field(() => String)
    conceptId!: string

    /** Whether the read passed the bar. */
    @Field(() => Boolean)
    passed!: boolean

    /** The mean level of the criteria. */
    @Field(() => Float)
    mean!: number

    /** The criteria in rubric order. */
    @Field(() => [ProjectCodeReadCriterionType])
    criteria!: ReadonlyArray<ProjectCodeReadCriterionType>

    /** The Socratic question of the teacher. */
    @Field(() => String, { nullable: true })
    question!: string | null

    /** The code location the learner pointed to. */
    @Field(() => String)
    location!: string

    /** The SHA-256 of the excerpt that was read; the excerpt itself is not kept. */
    @Field(() => String, { nullable: true })
    excerptHash!: string | null

    /** When it was graded, as an ISO 8601 instant. */
    @Field(() => String)
    gradedAt!: string
}
