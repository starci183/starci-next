import { Query } from "@nestjs/cqrs"
import type { CvPreviewView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetProjectCvPreviewRequest } from "./get-project-cv-preview.contracts"

/** Previews the CV line of a concept or a milestone of a project with the proof under it; it needs Premium. */
export class GetProjectCvPreviewQuery extends Query<CvPreviewView> {
    constructor(readonly params: ExecuteParams<GetProjectCvPreviewRequest>) {
        super()
    }
}
