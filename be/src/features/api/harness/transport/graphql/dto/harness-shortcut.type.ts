import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One shortcut a trial observed. */
export class HarnessShortcutType {
    /** The shortcut kind. */
    @Field(() => String)
    kind!: string

    /** Whether the agent call was refused. */
    @Field(() => Boolean)
    blocked!: boolean
}
