import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One row of the incident list: a Essentials lesson and whether its tier-2 incident is written. */
export class IncidentListItemType {
    /** The lesson the incident belongs to. */
    @Field(() => String)
    lessonId!: string

    /** The lesson title in the asked locale. */
    @Field(() => String)
    title!: string

    /** The topic slug. */
    @Field(() => String)
    topicId!: string

    /** The topic title. */
    @Field(() => String)
    topicTitle!: string

    /** The catalog group. */
    @Field(() => String)
    group!: string

    /** The difficulty of the lesson. */
    @Field(() => String)
    difficulty!: string

    /** The minutes the lesson takes. */
    @Field(() => Int)
    minutes!: number

    /** Whether the incident is written and can be opened. */
    @Field(() => Boolean)
    incidentAvailable!: boolean

    /** `authored` once the incident is written, `coming-soon` before. */
    @Field(() => String)
    status!: string
}
