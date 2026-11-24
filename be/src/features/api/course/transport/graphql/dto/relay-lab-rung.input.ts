import { Field, InputType } from "@nestjs/graphql"
import { IsString, Matches, MaxLength } from "class-validator"

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/u
/** A ladder tag as the lab@2 standard writes it: `c<k>-<words>`. */
const RUNG_TAG = /^c[0-9]+(-[a-z0-9]+)+$/u

@InputType()
/** One rung of a case's reference diff, asked by a paired device: the case and the rung's tag (its own, or the one before it). */
export class RelayLabRungInput {
    /** The lesson. */
    @Field(() => String)
    @IsString()
    @Matches(SLUG)
    lessonId!: string

    /** The unhappy case whose diff is shown. */
    @Field(() => String)
    @IsString()
    @Matches(SLUG)
    caseId!: string

    /** The rung's tag. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(RUNG_TAG)
    tag!: string
}
