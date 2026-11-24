import { QueryHandler } from "@nestjs/cqrs"
import { CourseCaseService, type CourseCasesView } from "@modules/domain/course"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetCourseCasesQuery } from "./get-course-cases.query"

@QueryHandler(GetCourseCasesQuery)
/** Answers every case of a lab in order: its status, hints, diff and reset for the learner, and the case to work on now. */
export class GetCourseCasesHandler extends ICQRSHandler<GetCourseCasesQuery, CourseCasesView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly cases: CourseCaseService,
    ) {
        super(logger)
    }

    protected override process(query: GetCourseCasesQuery): Promise<CourseCasesView> {
        return this.cases.cases(query.params.principal.id, query.params.request.lessonId)
    }
}
