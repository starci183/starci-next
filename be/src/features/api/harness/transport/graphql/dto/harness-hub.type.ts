import { Field, ObjectType } from "@nestjs/graphql"
import { HarnessPartType } from "./harness-part.type"

@ObjectType()
/** The hub of /harness: its three parts. */
export class HarnessHubType {
    /** The parts in order. */
    @Field(() => [HarnessPartType])
    parts!: Array<HarnessPartType>
}
