import { Command } from "@nestjs/cqrs"
import type { ChallengeView } from "@modules/domain/identity"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { SignInRequest } from "./sign-in.contracts"

/** Dispatches the sign-in operation without trusting client identity claims. */
export class SignInCommand extends Command<ChallengeView> {
    constructor(readonly params: PublicExecuteParams<SignInRequest>) {
        super()
    }
}
