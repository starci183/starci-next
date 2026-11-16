import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The newest relayed run of one scenario of a lesson; practice, never proof. */
export class LessonScenarioRunType {
    /** The scenario id. */
    @Field(() => String)
    scenarioId!: string

    /** running, passed or failed. */
    @Field(() => String)
    status!: string

    /** The run id. */
    @Field(() => String)
    runId!: string

    /** `scenario` or `challenge`, or null. */
    @Field(() => String, { nullable: true })
    slot!: string | null

    /** The challenge id of a challenge run, or null. */
    @Field(() => String, { nullable: true })
    ref!: string | null

    /** The exit code, or null while running. */
    @Field(() => Int, { nullable: true })
    exitCode!: number | null

    /** How long it ran in milliseconds, or null while running. */
    @Field(() => Int, { nullable: true })
    durationMs!: number | null

    /** The commit, or null. */
    @Field(() => String, { nullable: true })
    commit!: string | null

    /** The newest output of the run, or null. */
    @Field(() => String, { nullable: true })
    output!: string | null

    /** When the newest event was stored, ISO 8601. */
    @Field(() => String)
    at!: string
}
