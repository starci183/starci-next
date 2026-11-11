import { Controller, Get, Param, StreamableFile } from "@nestjs/common"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { LESSON_WORKSPACE_LANGUAGES, LessonError, LessonErrorCode } from "@modules/domain/lesson"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetLessonWorkspaceArchiveQuery } from "../../application/get-lesson-workspace-archive.query"
import { toGetLessonWorkspaceArchiveParams } from "./lesson-workspace-archive.mapper"

@Controller("api/lessons")
/** Offers one language workspace of a lesson as a ZIP; it needs a session and Premium, like the workspace of the lesson query. */
export class LessonWorkspaceArchiveController {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Answers `<lesson>-<language>.zip` as an attachment. */
    @Get(":lessonId/workspace/:language/download")
    async download(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Param("lessonId") lessonId: string,
        @Param("language") language: string,
    ): Promise<StreamableFile> {
        if (
            !/^[a-z0-9][a-z0-9-]{0,99}$/u.test(lessonId) ||
            !(LESSON_WORKSPACE_LANGUAGES as ReadonlyArray<string>).includes(language)
        )
            throw new LessonError({ code: LessonErrorCode.NotFound })
        const archive = await this.queryBus.execute(
            new GetLessonWorkspaceArchiveQuery(toGetLessonWorkspaceArchiveParams(identity, lessonId, language)),
        )
        return new StreamableFile(archive.content, {
            type: "application/zip",
            disposition: `attachment; filename="${archive.fileName}"`,
            length: archive.content.length,
        })
    }
}
