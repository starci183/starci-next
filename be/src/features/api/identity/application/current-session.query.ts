import { Query } from "@nestjs/cqrs"
import type { IdentityReadResult } from "@modules/domain/identity"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { CurrentSessionRequest } from "./current-session.contracts"

/** Dispatches the current-session operation without trusting client identity claims. */
export class CurrentSessionQuery extends Query<IdentityReadResult> {
    constructor(readonly params: PublicExecuteParams<CurrentSessionRequest>) {
        super()
    }
}
