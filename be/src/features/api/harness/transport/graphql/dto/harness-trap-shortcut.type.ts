import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One shortcut the observer of a trap flags. */
export class HarnessTrapShortcutType {
    /** The shortcut id. */
    @Field(() => String)
    id!: string

    /** The title. */
    @Field(() => String)
    title!: string
}
