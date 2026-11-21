import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One test of the Tìm sạn bug pack as every reader of the part sees it; its pass and fail texts and hints come with the learner's runs. */
export class LessonBugTestType {
    /** The test id. */
    @Field(() => String)
    id!: string

    /** The title. */
    @Field(() => String)
    title!: string

    /** The opener question id it belongs to, or null. */
    @Field(() => String, { nullable: true })
    essence!: string | null

    /** The command the learner CLI runs for it. */
    @Field(() => String)
    command!: string

    /** What a correct system shows. */
    @Field(() => String)
    expected!: string

    /** The label of what the run measures. */
    @Field(() => String)
    received!: string

    /** How many hints it has. */
    @Field(() => Int)
    hintCount!: number

    /** True for the final test, which opens once every other test passed. */
    @Field(() => Boolean)
    isFinal!: boolean
}

@ObjectType()
/** The Tìm sạn bug pack: the buggy copy of the source and its tests. */
export class LessonBugPackType {
    /** The tests, in order (the final one last). */
    @Field(() => [LessonBugTestType])
    tests!: ReadonlyArray<LessonBugTestType>
}

@ObjectType()
/** One main file of a Pattern stack. */
export class LessonPatternFileType {
    /** The path inside the reference folder. */
    @Field(() => String)
    path!: string

    /** What it holds. */
    @Field(() => String)
    note!: string
}

@ObjectType()
/** The snippet of a Pattern stack. */
export class LessonPatternSnippetType {
    /** The language of the code. */
    @Field(() => String)
    lang!: string

    /** The file it comes from. */
    @Field(() => String)
    file!: string

    /** The code. */
    @Field(() => String)
    code!: string
}

@ObjectType()
/** One stack of Pattern: where a real project keeps the pattern. Not graded. */
export class LessonPatternType {
    /** The stack id (nestjs, go, spring, dotnet). */
    @Field(() => String)
    stack!: string

    /** ready or soon. */
    @Field(() => String)
    status!: string

    /** The GitHub repository, owner/name, or empty. */
    @Field(() => String)
    repo!: string

    /** The folder inside it, or empty. */
    @Field(() => String)
    path!: string

    /** The link to the folder on GitHub, or null. */
    @Field(() => String, { nullable: true })
    url!: string | null

    /** Đặt code ở đâu. */
    @Field(() => String)
    where!: string

    /** Áp tới mức nào. */
    @Field(() => String)
    howFar!: string

    /** Server sập thì sao. */
    @Field(() => String)
    whenDown!: string

    /** The main files. */
    @Field(() => [LessonPatternFileType])
    files!: ReadonlyArray<LessonPatternFileType>

    /** The snippet, or null. */
    @Field(() => LessonPatternSnippetType, { nullable: true })
    snippet!: LessonPatternSnippetType | null
}
