import { Command } from "@nestjs/cqrs"
import type { ChallengeView } from "@modules/domain/identity"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { SignUpRequest } from "./sign-up.contracts"

/** Dispatches the sign-up operation without trusting client identity claims. */
export class SignUpCommand extends Command<ChallengeView> {
    constructor(readonly params: PublicExecuteParams<SignUpRequest>) {
        super()
    }
}
