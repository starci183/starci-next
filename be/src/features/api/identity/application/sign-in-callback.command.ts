import { Command } from "@nestjs/cqrs"
import type { IdentityRedirectView } from "@modules/domain/identity"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { SignInCallbackRequest } from "./sign-in-callback.contracts"

/** Dispatches the sign-in-callback operation without trusting client identity claims. */
export class SignInCallbackCommand extends Command<IdentityRedirectView> {
    constructor(readonly params: PublicExecuteParams<SignInCallbackRequest>) {
        super()
    }
}
