import { Field, ObjectType } from "@nestjs/graphql"
import { HarnessShortcutType } from "./harness-shortcut.type"

@ObjectType()
/** The newest trial result of a trap. */
export class HarnessTrialResultType {
    /** claude or codex. */
    @Field(() => String)
    tool!: string

    /** held, breached or incomplete. */
    @Field(() => String)
    verdict!: string

    /** Whether the tests ended green. */
    @Field(() => Boolean)
    testsGreen!: boolean

    /** The shortcuts observed. */
    @Field(() => [HarnessShortcutType])
    shortcuts!: Array<HarnessShortcutType>

    /** When it ran. */
    @Field(() => String)
    at!: string
}
