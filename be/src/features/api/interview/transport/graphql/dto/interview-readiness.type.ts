import { Field, ObjectType } from "@nestjs/graphql"
import { InterviewPillarType } from "./interview-pillar.type"

@ObjectType()
/** The hiring readiness at one track and tier. */
export class InterviewReadinessType {
    /** The track. */
    @Field(() => String)
    track!: string

    /** The tier. */
    @Field(() => String)
    tier!: string

    /** The technical pillar. */
    @Field(() => InterviewPillarType, { nullable: true })
    technical!: InterviewPillarType | null

    /** The behavioural pillar. */
    @Field(() => InterviewPillarType, { nullable: true })
    behavioral!: InterviewPillarType | null

    /** True when both pillars passed. */
    @Field(() => Boolean)
    ready!: boolean
}
