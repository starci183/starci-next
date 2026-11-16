import { QueryHandler } from "@nestjs/cqrs"
import { ProjectExtrasService, type CvPreviewView } from "@modules/domain/project"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetProjectCvPreviewQuery } from "./get-project-cv-preview.query"

@QueryHandler(GetProjectCvPreviewQuery)
/** Hands the message to the project capability, which authorizes and decides. */
export class GetProjectCvPreviewHandler extends ICQRSHandler<GetProjectCvPreviewQuery, CvPreviewView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly extras: ProjectExtrasService,
    ) {
        super(logger)
    }

    protected override process(query: GetProjectCvPreviewQuery): Promise<CvPreviewView> {
        return this.extras.cvPreview({ learnerId: query.params.principal.id, ...query.params.request })
    }
}
