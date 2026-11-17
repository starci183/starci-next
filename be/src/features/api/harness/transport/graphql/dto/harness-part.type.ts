import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One part of the /harness hub with the learner counts. */
export class HarnessPartType {
    /** BUILD, USE or DOCS. */
    @Field(() => String)
    key!: string

    /** The position. */
    @Field(() => Int)
    order!: number

    /** The title in the asked locale. */
    @Field(() => String)
    title!: string

    /** The summary in the asked locale. */
    @Field(() => String)
    summary!: string

    /** How many items the part has. */
    @Field(() => Int)
    total!: number

    /** How many are practising. */
    @Field(() => Int)
    practising!: number

    /** How many are proved. */
    @Field(() => Int)
    proved!: number

    /** How many are done. */
    @Field(() => Int)
    done!: number

    /** The next item to open, or null. */
    @Field(() => String, { nullable: true })
    nextId!: string | null
}
