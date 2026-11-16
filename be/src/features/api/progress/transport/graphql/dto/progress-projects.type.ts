import { Field, Int, ObjectType } from "@nestjs/graphql"
import { ProgressProjectType } from "./progress-project.type"

@ObjectType()
/** The Projects section of the progress page; subscribers only. */
export class ProgressProjectsType {
    /** Concepts proved over every project. */
    @Field(() => Int)
    conceptsProved!: number

    /** Concepts practising over every project. */
    @Field(() => Int)
    conceptsPractising!: number

    /** Concepts listed. */
    @Field(() => Int)
    conceptsTotal!: number

    /** Milestones done. */
    @Field(() => Int)
    milestonesDone!: number

    /** Milestones listed. */
    @Field(() => Int)
    milestonesTotal!: number

    /** The projects. */
    @Field(() => [ProgressProjectType])
    projects!: Array<ProgressProjectType>
}
