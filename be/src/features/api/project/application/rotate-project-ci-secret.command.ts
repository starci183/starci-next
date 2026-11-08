import { Command } from "@nestjs/cqrs"
import type { ProjectSecretView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RotateProjectCiSecretRequest } from "./rotate-project-ci-secret.contracts"

/** Replaces the CI secret of a project and answers the new one, shown this once. */
export class RotateProjectCiSecretCommand extends Command<ProjectSecretView> {
    constructor(readonly params: ExecuteParams<RotateProjectCiSecretRequest>) {
        super()
    }
}
