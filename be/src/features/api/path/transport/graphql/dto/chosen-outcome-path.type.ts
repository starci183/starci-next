import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The path the learner follows after choosing. */
export class ChosenOutcomePathType {
    /** The path now followed. */
    @Field(() => String)
    activePathId!: string

    /** When it was chosen, an ISO instant; choosing the same path again keeps the first time. */
    @Field(() => String)
    chosenAt!: string
}
