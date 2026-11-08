import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One thing left to do today for the streak. */
export class HubTodayType {
    /** The shard it belongs to. */
    @Field(() => String)
    shard!: string

    /** What it asks: review, lesson, practice, project, incident or interview. */
    @Field(() => String)
    kind!: string

    /** The title in the asked locale. */
    @Field(() => String)
    title!: string

    /** The route that does it. */
    @Field(() => String)
    link!: string

    /** When it falls due, when it has a due time. */
    @Field(() => String, { nullable: true })
    dueAt!: string | null
}
