import { QueryHandler } from "@nestjs/cqrs"
import { CourseCatalogService, type CourseCatalogEntryView } from "@modules/domain/course"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetCoursesQuery } from "./get-courses.query"

@QueryHandler(GetCoursesQuery)
/** Answers the catalog of courses with their lessons: free for every signed-in learner, no lab content in it. */
export class GetCoursesHandler extends ICQRSHandler<GetCoursesQuery, ReadonlyArray<CourseCatalogEntryView>> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly catalog: CourseCatalogService,
    ) {
        super(logger)
    }

    protected override process(): Promise<ReadonlyArray<CourseCatalogEntryView>> {
        return this.catalog.courses()
    }
}
