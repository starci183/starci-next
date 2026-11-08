import { Field, Int, ObjectType } from "@nestjs/graphql"
import { LessonTopicRefType } from "./lesson-topic-ref.type"

@ObjectType()
/** One lesson in the catalog. */
export class LessonCatalogItemType {
    /** The lesson id. */
    @Field(() => String)
    id!: string

    /** The live version. */
    @Field(() => String)
    version!: string

    /** The title in the asked locale. */
    @Field(() => String)
    title!: string

    /** The description in the asked locale. */
    @Field(() => String)
    description!: string

    /** The category. */
    @Field(() => String)
    category!: string

    /** The catalog group the lesson is listed under. */
    @Field(() => String)
    group!: string

    /** The topic the lesson belongs to. */
    @Field(() => LessonTopicRefType)
    topic!: LessonTopicRefType

    /** The difficulty. */
    @Field(() => String)
    difficulty!: string

    /** The minutes a learner needs. */
    @Field(() => Int)
    minutes!: number

    /** The implementation languages. */
    @Field(() => [String])
    languages!: ReadonlyArray<string>

    /** The cloud providers. */
    @Field(() => [String])
    providers!: ReadonlyArray<string>
}
