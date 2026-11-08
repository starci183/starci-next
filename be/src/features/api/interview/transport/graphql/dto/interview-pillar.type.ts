import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One pillar of the hiring readiness. */
export class InterviewPillarType {
    /** The best score. */
    @Field(() => Int)
    bestScore!: number

    /** The best verdict. */
    @Field(() => String)
    verdict!: string
}
