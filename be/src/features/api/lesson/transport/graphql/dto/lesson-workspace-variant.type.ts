import { Field, ObjectType } from "@nestjs/graphql"
import { LessonCommandsType } from "./lesson-commands.type"
import { LessonWorkspaceFileType } from "./lesson-workspace-file.type"

@ObjectType()
/** The workspace of one language a Premium learner receives for the lab. */
export class LessonWorkspaceVariantType {
    /** The language id: typescript, java, csharp or go. */
    @Field(() => String)
    language!: string

    /** The runtime. */
    @Field(() => String)
    runtime!: string

    /** The test commands. */
    @Field(() => LessonCommandsType)
    commands!: LessonCommandsType

    /** The files. */
    @Field(() => [LessonWorkspaceFileType])
    files!: ReadonlyArray<LessonWorkspaceFileType>
}
