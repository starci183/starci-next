import { Controller, Get, Param, StreamableFile } from "@nestjs/common"
import type { QueryBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetLessonSourceArchiveQuery } from "../../application/get-lesson-source-archive.query"
import { GetLessonBugsArchiveQuery } from "../../application/get-lesson-bugs-archive.query"

@Controller("api/relay/lessons")
/**
 * The byte door of a lesson's source (SCENARIO-CONTRACT v3 §4): the tarball whose sha256 the lesson manifest signed, for the
 * paired device that sends its token (Premium learner); 401 without a device, 403 without Premium.
 */
export class LessonSourceController {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Streams the contents of `source/` of the live lesson version as `application/gzip`; never `hidden/`. */
    @Get(":lessonId/source.tgz")
    @Credential({ kind: "tool-token" })
    async download(
        @CurrentCredential() credential: CredentialPrincipal,
        @Param("lessonId") lessonId: string,
    ): Promise<StreamableFile> {
        const found = await this.queryBus.execute(
            new GetLessonSourceArchiveQuery({
                request: {
                    device: { learnerId: credential.workspaceId, deviceId: credential.subject },
                    lessonId,
                },
            }),
        )
        return new StreamableFile(found.content, {
            type: "application/gzip",
            disposition: `attachment; filename="${lessonId}-source.tgz"`,
            length: found.content.length,
        })
    }

    /** Streams the contents of `bugs/source/` (the Tìm sạn bug pack) of the live lesson version as `application/gzip`. */
    @Get(":lessonId/bugs.tgz")
    @Credential({ kind: "tool-token" })
    async downloadBugs(
        @CurrentCredential() credential: CredentialPrincipal,
        @Param("lessonId") lessonId: string,
    ): Promise<StreamableFile> {
        const found = await this.queryBus.execute(
            new GetLessonBugsArchiveQuery({
                request: {
                    device: { learnerId: credential.workspaceId, deviceId: credential.subject },
                    lessonId,
                },
            }),
        )
        return new StreamableFile(found.content, {
            type: "application/gzip",
            disposition: `attachment; filename="${lessonId}-bugs.tgz"`,
            length: found.content.length,
        })
    }
}
