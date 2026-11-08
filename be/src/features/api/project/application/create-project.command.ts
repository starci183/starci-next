import { Command } from "@nestjs/cqrs"
import type { ProjectSecretView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { CreateProjectRequest } from "./create-project.contracts"

/** Creates a project for the signed-in learner and answers it with its CI secret, shown this once. */
export class CreateProjectCommand extends Command<ProjectSecretView> {
    constructor(readonly params: ExecuteParams<CreateProjectRequest>) {
        super()
    }
}
