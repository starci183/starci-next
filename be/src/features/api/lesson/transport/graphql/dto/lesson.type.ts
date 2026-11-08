import { Field, Int, ObjectType } from "@nestjs/graphql"
import { LessonTopicRefType } from "./lesson-topic-ref.type"
import { LessonReferenceType } from "./lesson-reference.type"
import { LessonSectionType } from "./lesson-section.type"
import { LessonStatementType } from "./lesson-statement.type"
import { LessonWorkspaceType } from "./lesson-workspace.type"

@ObjectType()
/** The public projection of one live lesson in one locale. */
export class LessonType {
    /** The lesson id. */
    @Field(() => String)
    id!: string

    /** The version served. */
    @Field(() => String)
    version!: string

    /** The locale of the text. */
    @Field(() => String)
    locale!: string

    /** The title. */
    @Field(() => String)
    title!: string

    /** The description. */
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

    /** The implementation language, or agnostic. */
    @Field(() => String)
    implementation!: string

    /** The overview markdown. */
    @Field(() => String)
    overview!: string

    /** The outcomes. */
    @Field(() => [LessonStatementType])
    learningOutcomes!: ReadonlyArray<LessonStatementType>

    /** The prerequisites. */
    @Field(() => [LessonStatementType])
    prerequisites!: ReadonlyArray<LessonStatementType>

    /** The references. */
    @Field(() => [LessonReferenceType])
    references!: ReadonlyArray<LessonReferenceType>

    /** Whether the learner holds Premium. */
    @Field(() => Boolean)
    isPremium!: boolean

    /** The sections in order. */
    @Field(() => [LessonSectionType])
    sections!: ReadonlyArray<LessonSectionType>

    /** The workspace, or null without Premium or without a workspace. */
    @Field(() => LessonWorkspaceType, { nullable: true })
    workspace!: LessonWorkspaceType | null
}
