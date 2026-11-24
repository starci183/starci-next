import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The lesson's source as `starci-relay pull` fetches it (the lesson folder's `source/`, TypeScript). */
export class LessonSourceType {
    /** The languages it ships (TypeScript). */
    @Field(() => [String])
    langs!: ReadonlyArray<string>

    /** The ref the lesson was written against, or null. */
    @Field(() => String, { nullable: true })
    ref!: string | null
}

@ObjectType()
/** One component of the architecture and the invariants it keeps. */
export class LessonArchitectureComponentType {
    /** The component. */
    @Field(() => String)
    name!: string

    /** The port, or null. */
    @Field(() => String, { nullable: true })
    port!: string | null

    /** What it does, or null. */
    @Field(() => String, { nullable: true })
    role!: string | null

    /** The invariant ids it keeps. */
    @Field(() => [String])
    invariants!: ReadonlyArray<string>
}

@ObjectType()
/** The architecture of the source repository. */
export class LessonArchitectureType {
    /** The diagram, mermaid. */
    @Field(() => String)
    diagram!: string

    /** The components. */
    @Field(() => [LessonArchitectureComponentType])
    components!: ReadonlyArray<LessonArchitectureComponentType>
}

@ObjectType()
/** One code-walk entry: where an invariant lives, as a snippet equal to the file. */
export class LessonCodeWalkType {
    /** The entry id. */
    @Field(() => String)
    id!: string

    /** The heading. */
    @Field(() => String)
    title!: string

    /** The invariant id. */
    @Field(() => String)
    invariant!: string

    /** The file, relative to the repository root. */
    @Field(() => String)
    file!: string

    /** The first line of the snippet in the file. */
    @Field(() => Int)
    line!: number

    /** The snippet. */
    @Field(() => String)
    snippet!: string

    /** Why the code is so, or null. */
    @Field(() => String, { nullable: true })
    why!: string | null
}
