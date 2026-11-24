import { Controller, Get, Param, StreamableFile } from "@nestjs/common"
import type { QueryBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { labArchiveNameOf, type RelayLabCut } from "@modules/domain/relay"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetCourseLabArchiveQuery } from "../../application/get-course-lab-archive.query"

@Controller("api/relay/courses")
/**
 * The byte door of a lab's tarballs: the lesson branch (`bugs.tgz`) whose sha256 the lab manifest signed, and the solution
 * (`solution.tgz`) and the NestJS version (`framework/nestjs.tgz`), both refused until a submission of the learner passed. For the paired
 * device that sends its token: 401 without a device, 403 without the part's access (and for those two before a pass).
 */
export class CourseLabSourceController {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Streams the lesson branch of the lab as `application/gzip`. */
    @Get(":courseId/:lessonId/bugs.tgz")
    @Credential({ kind: "tool-token" })
    downloadBugs(
        @CurrentCredential() credential: CredentialPrincipal,
        @Param("courseId") courseId: string,
        @Param("lessonId") lessonId: string,
    ): Promise<StreamableFile> {
        return this.stream(credential, courseId, lessonId, "bugs")
    }

    /** Streams the solution of the lab as `application/gzip`, once a submission of the learner passed. */
    @Get(":courseId/:lessonId/solution.tgz")
    @Credential({ kind: "tool-token" })
    downloadSolution(
        @CurrentCredential() credential: CredentialPrincipal,
        @Param("courseId") courseId: string,
        @Param("lessonId") lessonId: string,
    ): Promise<StreamableFile> {
        return this.stream(credential, courseId, lessonId, "solution")
    }

    /** Streams the NestJS version of the lab as `application/gzip`, once a submission of the learner passed (the rule of the solution). */
    @Get(":courseId/:lessonId/framework/nestjs.tgz")
    @Credential({ kind: "tool-token" })
    downloadNestjs(
        @CurrentCredential() credential: CredentialPrincipal,
        @Param("courseId") courseId: string,
        @Param("lessonId") lessonId: string,
    ): Promise<StreamableFile> {
        return this.stream(credential, courseId, lessonId, "framework:nestjs")
    }

    /** Asks for one cut's tarball for the device the credential proved and streams it. */
    private async stream(
        credential: CredentialPrincipal,
        courseId: string,
        lessonId: string,
        cut: RelayLabCut,
    ): Promise<StreamableFile> {
        const found = await this.queryBus.execute(
            new GetCourseLabArchiveQuery({
                request: {
                    device: { learnerId: credential.workspaceId, deviceId: credential.subject },
                    courseId,
                    lessonId,
                    cut,
                },
            }),
        )
        return new StreamableFile(found.content, {
            type: "application/gzip",
            disposition: `attachment; filename="${labArchiveNameOf(lessonId, cut)}"`,
            length: found.content.length,
        })
    }
}
