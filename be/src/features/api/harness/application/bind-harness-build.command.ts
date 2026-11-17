import { Command } from "@nestjs/cqrs"
import type { HarnessBindingView } from "@modules/domain/harness"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { BindHarnessBuildRequest } from "./harness.contracts"

/** Binds a harness build to a GitHub repository of the signed-in learner, whose attested CI then proves the build stages. */
export class BindHarnessBuildCommand extends Command<HarnessBindingView> {
    constructor(readonly params: ExecuteParams<BindHarnessBuildRequest>) {
        super()
    }
}
