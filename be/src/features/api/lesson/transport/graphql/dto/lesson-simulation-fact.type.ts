import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A counter or reading shown with a simulation state. */
export class LessonSimulationFactType {
    /** What is measured. */
    @Field(() => String)
    label!: string

    /** Its value in the state. */
    @Field(() => String)
    value!: string
}
