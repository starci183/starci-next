import { QueryHandler } from "@nestjs/cqrs"
import { RelayLabService, type LabArchive } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetCourseLabArchiveQuery } from "./get-course-lab-archive.query"

@QueryHandler(GetCourseLabArchiveQuery)
/** Answers a lab cut's tarball for a paired device whose learner may read the lab (the solution only once they passed). */
export class GetCourseLabArchiveHandler extends ICQRSHandler<GetCourseLabArchiveQuery, LabArchive> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly lab: RelayLabService,
    ) {
        super(logger)
    }

    protected override process(query: GetCourseLabArchiveQuery): Promise<LabArchive> {
        const { device, courseId, lessonId, cut } = query.params.request
        return this.lab.archive(device, courseId, lessonId, cut)
    }
}
