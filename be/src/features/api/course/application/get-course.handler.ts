import { QueryHandler } from "@nestjs/cqrs"
import { CourseCatalogService, type CourseCatalogDetailView } from "@modules/domain/course"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetCourseQuery } from "./get-course.query"

@QueryHandler(GetCourseQuery)
/** Answers one course of the catalog with its lessons and the system map of its intro: free for every signed-in learner. */
export class GetCourseHandler extends ICQRSHandler<GetCourseQuery, CourseCatalogDetailView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly catalog: CourseCatalogService,
    ) {
        super(logger)
    }

    protected override process(query: GetCourseQuery): Promise<CourseCatalogDetailView> {
        return this.catalog.course(query.params.request.courseId)
    }
}
