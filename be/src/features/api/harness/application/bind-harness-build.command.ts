import { Command } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { BindHarnessBuildRequest } from "./harness.contracts"

/** The build and project a bind succeeded for. */
export interface HarnessBinding {
    /** The build. */
    readonly buildId: string
    /** The bound project. */
    readonly projectId: string
}

/** Binds a harness build to the signed-in learner agent project, whose attested CI then proves the build stages. */
export class BindHarnessBuildCommand extends Command<HarnessBinding> {
    constructor(readonly params: ExecuteParams<BindHarnessBuildRequest>) {
        super()
    }
}
