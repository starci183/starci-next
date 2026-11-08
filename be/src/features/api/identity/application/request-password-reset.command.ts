import { Command } from "@nestjs/cqrs"
import type { ResetChallengeView } from "@modules/domain/identity"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { RequestPasswordResetRequest } from "./request-password-reset.contracts"

/** Dispatches the request-password-reset operation without trusting client identity claims. */
export class RequestPasswordResetCommand extends Command<ResetChallengeView> {
    constructor(readonly params: PublicExecuteParams<RequestPasswordResetRequest>) {
        super()
    }
}
