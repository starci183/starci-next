import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One line of the recent-activity timeline. */
export class ProgressActivityType {
    /** A stable id of the line. */
    @Field(() => String)
    id!: string

    /** lesson-done, concept-proved, experience-verified or harness-stage. */
    @Field(() => String)
    kind!: string

    /** What it was about. */
    @Field(() => String)
    title!: string

    /** When, ISO 8601 UTC. */
    @Field(() => String)
    at!: string
}
