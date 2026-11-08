import { Command } from "@nestjs/cqrs"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { VerifyPasswordResetRequest } from "./verify-password-reset.contracts"

/** Dispatches the verify-password-reset operation without trusting client identity claims. */
export class VerifyPasswordResetCommand extends Command<void> {
    constructor(readonly params: PublicExecuteParams<VerifyPasswordResetRequest>) {
        super()
    }
}
