import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One shortcut a trial observed. */
export class HarnessShortcutType {
    /** The shortcut kind, the id of the shortcut of the trap. */
    @Field(() => String)
    kind!: string

    /** Whether the agent call was refused. */
    @Field(() => Boolean)
    blocked!: boolean

    /** The title of the shortcut of the trap, or null. */
    @Field(() => String, { nullable: true })
    title!: string | null
}
