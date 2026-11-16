import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The newest trial of one trap. */
export class ProgressTrialType {
    /** The trap id. */
    @Field(() => String)
    trap!: string

    /** The title. */
    @Field(() => String)
    title!: string

    /** The tool of the newest run, or null. */
    @Field(() => String, { nullable: true })
    tool!: string | null

    /** held, breached or incomplete; null when never tried. */
    @Field(() => String, { nullable: true })
    verdict!: string | null

    /** When it ran, or null. */
    @Field(() => String, { nullable: true })
    at!: string | null
}
