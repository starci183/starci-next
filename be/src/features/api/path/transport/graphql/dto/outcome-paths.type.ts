import { Field, ObjectType } from "@nestjs/graphql"
import { OutcomePathType } from "./outcome-path.type"

@ObjectType()
/** The five outcome paths and the one the learner follows. */
export class OutcomePathsType {
    /** The path the learner follows, or null. */
    @Field(() => String, { nullable: true })
    activePathId!: string | null

    /** The paths in the stable order. */
    @Field(() => [OutcomePathType])
    paths!: Array<OutcomePathType>
}
