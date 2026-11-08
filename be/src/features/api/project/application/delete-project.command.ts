import { Command } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ProjectDeletedView } from "@modules/domain/project"
import type { DeleteProjectRequest } from "./delete-project.contracts"

/** Deletes a project of the signed-in learner with its evidence. */
export class DeleteProjectCommand extends Command<ProjectDeletedView> {
    constructor(readonly params: ExecuteParams<DeleteProjectRequest>) {
        super()
    }
}
