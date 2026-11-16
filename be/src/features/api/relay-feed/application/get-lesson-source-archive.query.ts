import { Query } from "@nestjs/cqrs"
import type { LessonSourceArchive } from "@modules/domain/lesson"
import type { DevicePrincipal } from "@modules/domain/relay"
import type { PublicExecuteParams } from "@modules/platform/cqrs"

/** The device that asks and the lesson whose source tarball it pulls. */
export interface GetLessonSourceArchiveRequest {
    /** The paired device the tool-token credential proved. */
    readonly device: DevicePrincipal
    /** The lesson slug. */
    readonly lessonId: string
}

/** Asks for the `source/` tarball of the live version of a lesson, for a paired device. */
export class GetLessonSourceArchiveQuery extends Query<LessonSourceArchive> {
    constructor(readonly params: PublicExecuteParams<GetLessonSourceArchiveRequest>) {
        super()
    }
}
