import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One step of an open lab. */
export class AgentLabStepType {
    /** The step text in the asked locale. */
    @Field(() => String)
    text!: string

    /** The official doc page the step cites. */
    @Field(() => String)
    sourceUrl!: string
}
