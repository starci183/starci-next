import { Query } from "@nestjs/cqrs"
import type { LessonSourceArchive } from "@modules/domain/lesson"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonSourceArchiveRequest } from "./get-lesson-source-archive.query"

/** Asks for the Tìm sạn bug-pack tarball (`bugs/source/`) of the live version of a lesson, for a paired device. */
export class GetLessonBugsArchiveQuery extends Query<LessonSourceArchive> {
    constructor(readonly params: PublicExecuteParams<GetLessonSourceArchiveRequest>) {
        super()
    }
}
