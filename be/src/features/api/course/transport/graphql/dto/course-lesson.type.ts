import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A text of the lab record: Vietnamese, and English when the record carries it. */
export class CourseTextType {
    /** Vietnamese. */
    @Field(() => String)
    vi!: string

    /** English, or null when the record has none. */
    @Field(() => String, { nullable: true })
    en!: string | null
}

@ObjectType()
/** A text of the lab record in both languages. */
export class CourseBilingualType {
    /** Vietnamese. */
    @Field(() => String)
    vi!: string

    /** English. */
    @Field(() => String)
    en!: string
}

@ObjectType()
/** One invariant statement of the lab. */
export class CourseInvariantType extends CourseBilingualType {
    /** The invariant id. */
    @Field(() => String)
    id!: string
}

@ObjectType()
/** One chaos switch a case runs under. */
export class CourseChaosType {
    /** The switch key. */
    @Field(() => String)
    key!: string

    /** The switch value, as text. */
    @Field(() => String)
    value!: string
}

@ObjectType()
/** One chaos switch of the lab with the label the lab declares for it. */
export class CourseChaosLabelType {
    /** The switch key. */
    @Field(() => String)
    id!: string

    /** The label in both languages. */
    @Field(() => CourseBilingualType)
    label!: CourseBilingualType
}

@ObjectType()
/** One hint level of a case for the learner: the text only once the level is open. */
export class CourseHintType {
    /** The level, 1 to 3. */
    @Field(() => Int)
    level!: number

    /** The hint text, or null while the level is closed. */
    @Field(() => String, { nullable: true })
    text!: string | null

    /** Whether the learner opened this level. */
    @Field(() => Boolean)
    unlocked!: boolean
}

@ObjectType()
/** One happy or unhappy case of the lab. */
export class CourseCaseSpecType {
    /** The case id. */
    @Field(() => String)
    id!: string

    /** The title in both languages. */
    @Field(() => CourseBilingualType)
    title!: CourseBilingualType

    /** The chaos the case runs under. */
    @Field(() => [CourseChaosType])
    chaos!: ReadonlyArray<CourseChaosType>

    /** The ids of the invariants the case must keep. */
    @Field(() => [String])
    invariants!: ReadonlyArray<string>

    /** The term the case teaches, or null for a happy case. */
    @Field(() => String, { nullable: true })
    teaches!: string | null

    /** The hint levels; empty for a happy case. */
    @Field(() => [CourseHintType])
    hints!: ReadonlyArray<CourseHintType>

    /** Whether a reference step exists to reset to. */
    @Field(() => Boolean)
    hasReference!: boolean
}

@ObjectType()
/** One term learner-facing words may name. */
export class CourseAllowedTermType {
    /** The term id. */
    @Field(() => String)
    id!: string

    /** The term. */
    @Field(() => String)
    term!: string
}

@ObjectType()
/** One service of the lab's declared stack. */
export class CourseServiceType {
    /** The service id. */
    @Field(() => String)
    id!: string

    /** The port it listens on. */
    @Field(() => Int)
    port!: number

    /** Its own database, or null. */
    @Field(() => String, { nullable: true })
    db!: string | null

    /** The dependencies it uses. */
    @Field(() => [String])
    uses!: ReadonlyArray<string>

    /** What it does. */
    @Field(() => CourseTextType)
    role!: CourseTextType
}

@ObjectType()
/** One backing dependency of the lab's declared stack. */
export class CourseDepType {
    /** The dependency id. */
    @Field(() => String)
    id!: string

    /** The image it runs. */
    @Field(() => String)
    image!: string

    /** What it is for. */
    @Field(() => CourseTextType)
    role!: CourseTextType
}

@ObjectType()
/** The stack the lab declares. */
export class CourseStackType {
    /** The language. */
    @Field(() => String)
    language!: string

    /** The runtime. */
    @Field(() => String)
    runtime!: string

    /** The test runner. */
    @Field(() => String)
    test!: string

    /** The services. */
    @Field(() => [CourseServiceType])
    services!: ReadonlyArray<CourseServiceType>

    /** The backing dependencies. */
    @Field(() => [CourseDepType])
    deps!: ReadonlyArray<CourseDepType>
}

@ObjectType()
/** The dimensions of the hidden grading matrix, never its cells. */
export class CourseGraderType {
    /** The steps of the matrix. */
    @Field(() => [String])
    steps!: ReadonlyArray<string>

    /** The faults of the matrix. */
    @Field(() => [String])
    faults!: ReadonlyArray<string>
}

@ObjectType()
/** One file of the NestJS version and where it comes from in the Express lab. */
export class CourseNestMapType {
    /** The path in the lab. */
    @Field(() => String)
    from!: string

    /** The path in the NestJS version. */
    @Field(() => String)
    to!: string
}

@ObjectType()
/** The lab@2 record of one lesson as the web may see it; hint texts only for the levels the learner opened. */
export class CourseLessonType {
    /** The lesson id. */
    @Field(() => String)
    lessonId!: string

    /** The version label of the live record. */
    @Field(() => String)
    version!: string

    /** The lab repository id. */
    @Field(() => String)
    lab!: string

    /** The concept the lesson teaches. */
    @Field(() => String)
    concept!: string

    /** The concepts that come before it. */
    @Field(() => [String])
    requires!: ReadonlyArray<string>

    /** The terms learner-facing words may name. */
    @Field(() => [CourseAllowedTermType])
    allowedTerms!: ReadonlyArray<CourseAllowedTermType>

    /** The declared stack. */
    @Field(() => CourseStackType)
    stack!: CourseStackType

    /** The one file the learner edits. */
    @Field(() => String)
    learnerFile!: string

    /** Every invariant in both languages. */
    @Field(() => [CourseInvariantType])
    invariants!: ReadonlyArray<CourseInvariantType>

    /** The happy cases in order. */
    @Field(() => [CourseCaseSpecType])
    happy!: ReadonlyArray<CourseCaseSpecType>

    /** The unhappy cases in order. */
    @Field(() => [CourseCaseSpecType])
    unhappy!: ReadonlyArray<CourseCaseSpecType>

    /** The label of each chaos switch the lab declares; empty when the lab declares none. */
    @Field(() => [CourseChaosLabelType])
    chaos!: ReadonlyArray<CourseChaosLabelType>

    /** The dimensions of the hidden grading matrix. */
    @Field(() => CourseGraderType)
    grader!: CourseGraderType

    /** The file map of the NestJS version. */
    @Field(() => [CourseNestMapType])
    nestjs!: ReadonlyArray<CourseNestMapType>
}
