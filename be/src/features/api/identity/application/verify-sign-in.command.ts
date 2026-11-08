import { Command } from "@nestjs/cqrs"
import type { SessionIssued } from "@modules/domain/identity"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { VerifySignInRequest } from "./verify-sign-in.contracts"

/** Dispatches the verify-sign-in operation without trusting client identity claims. */
export class VerifySignInCommand extends Command<SessionIssued> {
    constructor(readonly params: PublicExecuteParams<VerifySignInRequest>) {
        super()
    }
}
