import { Query } from "@nestjs/cqrs"
import type { HarnessDocView } from "@modules/domain/harness"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { HarnessDocRequest } from "./harness.contracts"

/** Asks for one doc with its sections. */
export class GetHarnessDocQuery extends Query<HarnessDocView> {
    constructor(readonly params: ExecuteParams<HarnessDocRequest>) {
        super()
    }
}
