import { Command } from "@nestjs/cqrs"
import type { SessionIssued } from "@modules/domain/identity"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { VerifySignUpRequest } from "./verify-sign-up.contracts"

/** Dispatches the verify-sign-up operation without trusting client identity claims. */
export class VerifySignUpCommand extends Command<SessionIssued> {
    constructor(readonly params: PublicExecuteParams<VerifySignUpRequest>) {
        super()
    }
}
