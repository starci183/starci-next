import { Field, ObjectType } from "@nestjs/graphql"
import { LessonCommandsType } from "./lesson-commands.type"
import { LessonWorkspaceFileType } from "./lesson-workspace-file.type"

@ObjectType()
/** The workspace a Premium learner receives for the lab. */
export class LessonWorkspaceType {
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
