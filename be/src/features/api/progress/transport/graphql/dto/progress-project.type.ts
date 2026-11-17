import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One project of the Projects section. */
export class ProgressProjectType {
    /** The project id. */
    @Field(() => String)
    projectId!: string

    /** The name. */
    @Field(() => String)
    name!: string

    /** Concepts proved. */
    @Field(() => Int)
    proved!: number

    /** Concepts practising. */
    @Field(() => Int)
    practising!: number

    /** Concepts listed. */
    @Field(() => Int)
    total!: number

    /** Milestones done. */
    @Field(() => Int)
    milestonesDone!: number

    /** Milestones listed. */
    @Field(() => Int)
    milestonesTotal!: number
}
