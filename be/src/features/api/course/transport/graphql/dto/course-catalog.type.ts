import { Field, Int, ObjectType } from "@nestjs/graphql"
import { CourseBilingualType } from "./course-lesson.type"

@ObjectType()
/** One lesson of a course in the catalog. */
export class CourseCatalogLessonType {
    /** The lesson id, the key of its lab record. */
    @Field(() => String)
    lessonId!: string

    /** The concept the lesson teaches. */
    @Field(() => String)
    concept!: string

    /** The concept as the lab record words it, or the concept id when the lab has none. */
    @Field(() => String)
    conceptTerm!: string

    /** The lesson title: its course's title when the course has this one lesson, else the concept term in both languages. */
    @Field(() => CourseBilingualType)
    title!: CourseBilingualType

    /** Whether a lab record of the lesson is live. */
    @Field(() => Boolean)
    available!: boolean
}

@ObjectType()
/** One course of the catalog. */
export class CourseCatalogType {
    /** The course id. */
    @Field(() => String)
    courseId!: string

    /** The course title. */
    @Field(() => CourseBilingualType)
    title!: CourseBilingualType

    /** What the course is about. */
    @Field(() => CourseBilingualType)
    summary!: CourseBilingualType

    /** The one sentence of what the concept does, the caption of the catalog row; the summary when the record has none. */
    @Field(() => CourseBilingualType)
    description!: CourseBilingualType

    /** The course's place in the concept graph's teaching order (1-based); null when the record carries none (listed last). */
    @Field(() => Int, { nullable: true })
    order!: number | null

    /** Its lessons in teaching order. */
    @Field(() => [CourseCatalogLessonType])
    lessons!: ReadonlyArray<CourseCatalogLessonType>
}

@ObjectType()
/** One service of the system map of a course. */
export class CourseSystemNodeType {
    /** The node id. */
    @Field(() => String)
    id!: string

    /** The service the node stands for; null for a node that is not one of the lab's services (a database the lesson draws). */
    @Field(() => String, { nullable: true })
    service!: string | null

    /** The node name. */
    @Field(() => CourseBilingualType)
    label!: CourseBilingualType

    /** What the node does. */
    @Field(() => CourseBilingualType)
    role!: CourseBilingualType
}

@ObjectType()
/** One call between two nodes of the system map. */
export class CourseSystemEdgeType {
    /** The calling node id. */
    @Field(() => String)
    from!: string

    /** The called node id. */
    @Field(() => String)
    to!: string
}

@ObjectType()
/** The system map the lessons of a course grow. */
export class CourseSystemType {
    /** The services. */
    @Field(() => [CourseSystemNodeType])
    nodes!: ReadonlyArray<CourseSystemNodeType>

    /** The calls between them. */
    @Field(() => [CourseSystemEdgeType])
    edges!: ReadonlyArray<CourseSystemEdgeType>
}

@ObjectType()
/** One course with the system map of its intro. */
export class CourseCatalogDetailType extends CourseCatalogType {
    /** The system the lessons grow. */
    @Field(() => CourseSystemType)
    system!: CourseSystemType
}
