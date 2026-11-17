import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The doctor verdict of one tool. */
export class ProgressDoctorType {
    /** claude or codex. */
    @Field(() => String)
    tool!: string

    /** not-run, failed or passed. */
    @Field(() => String)
    verdict!: string

    /** Probes passed. */
    @Field(() => Int)
    passed!: number

    /** Probes of the tool. */
    @Field(() => Int)
    total!: number
}
