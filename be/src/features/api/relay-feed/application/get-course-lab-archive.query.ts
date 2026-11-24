import { Query } from "@nestjs/cqrs"
import type { DevicePrincipal, LabArchive, RelayLabCut } from "@modules/domain/relay"
import type { PublicExecuteParams } from "@modules/platform/cqrs"

/** The device that asks and the lab cut whose tarball it pulls. */
export interface GetCourseLabArchiveRequest {
    /** The paired device the tool-token credential proved. */
    readonly device: DevicePrincipal
    /** The course slug. */
    readonly courseId: string
    /** The lesson slug. */
    readonly lessonId: string
    /** The lesson branch (`bugs`) or the solution (`solution`, only after a passing submission). */
    readonly cut: RelayLabCut
}

/** Asks for the tarball of one cut of a lab (the lesson branch or the solution), for a paired device. */
export class GetCourseLabArchiveQuery extends Query<LabArchive> {
    constructor(readonly params: PublicExecuteParams<GetCourseLabArchiveRequest>) {
        super()
    }
}
