import { Command } from "@nestjs/cqrs"
import type { ProjectSummaryView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { UpdateProjectRequest } from "./update-project.contracts"

/** Changes a project of the signed-in learner. */
export class UpdateProjectCommand extends Command<ProjectSummaryView> {
    constructor(readonly params: ExecuteParams<UpdateProjectRequest>) {
        super()
    }
}
