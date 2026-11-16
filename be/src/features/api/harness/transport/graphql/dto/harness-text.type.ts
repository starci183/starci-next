import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One step of a stage guide or one section of a guide or doc. */
export class HarnessTextType {
    /** The id. */
    @Field(() => String)
    id!: string

    /** The position. */
    @Field(() => Int)
    order!: number

    /** The title. */
    @Field(() => String)
    title!: string

    /** The markdown body. */
    @Field(() => String)
    body!: string

    /** The copy-run blocks. */
    @Field(() => [String])
    run!: Array<string>
}
