import { Command } from "@nestjs/cqrs"
import type { ProjectRepositoryView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SetProjectRepositoryRequest } from "./set-project-repository.contracts"

/** Binds a learner's own project to the GitHub repository its attested CI runs must come from. */
export class SetProjectRepositoryCommand extends Command<ProjectRepositoryView> {
    constructor(readonly params: ExecuteParams<SetProjectRepositoryRequest>) {
        super()
    }
}
