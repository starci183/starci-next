import { Field, ObjectType } from "@nestjs/graphql"
import { ProjectConceptLessonType } from "./project-concept-lesson.type"
import { ProjectSlotType } from "./project-slot.type"
import { ProjectFailureType } from "./project-failure.type"

@ObjectType()
/** One concept of a milestone in a project. */
export class ProjectConceptType {
    /** The concept id. */
    @Field(() => String)
    id!: string

    /** The label in the locale of the request. */
    @Field(() => String)
    label!: string

    /** behaviour or structure. */
    @Field(() => String)
    kind!: string

    /** nothing yet, practising or proved. */
    @Field(() => String)
    state!: string

    /** True while the teacher is writing the lesson. */
    @Field(() => Boolean)
    comingSoon!: boolean

    /** The lesson to relearn. */
    @Field(() => ProjectConceptLessonType, { nullable: true })
    lesson!: ProjectConceptLessonType | null

    /** The code location the learner points to. */
    @Field(() => String, { nullable: true })
    location!: string | null

    /** The endpoint the probes aim at. */
    @Field(() => String, { nullable: true })
    endpoint!: string | null

    /** The sample body the probes send. */
    @Field(() => String, { nullable: true })
    sampleBody!: string | null

    /** The evidence slots in order. */
    @Field(() => [ProjectSlotType])
    slots!: ReadonlyArray<ProjectSlotType>

    /** The latest failing result. */
    @Field(() => ProjectFailureType, { nullable: true })
    failing!: ProjectFailureType | null

    /** The question of the AI teacher from the last code read. */
    @Field(() => String, { nullable: true })
    aiQuestion!: string | null
}
