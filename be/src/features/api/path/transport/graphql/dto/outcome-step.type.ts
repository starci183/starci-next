import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One step of an outcome path. */
export class OutcomeStepType {
    /** The step id, stable inside its path. */
    @Field(() => String)
    stepId!: string

    /** The part it sends to: essentials, review, practice, projects, interview or profile. */
    @Field(() => String)
    part!: string

    /** What the learner does, in the asked locale. */
    @Field(() => String)
    title!: string

    /** Where the step is done. */
    @Field(() => String)
    link!: string
}
