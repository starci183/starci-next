import { Command } from "@nestjs/cqrs"
import type { IdentityRedirectView } from "@modules/domain/identity"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { StartSignInRequest } from "./start-sign-in.contracts"

/** Dispatches the start-sign-in operation without trusting client identity claims. */
export class StartSignInCommand extends Command<IdentityRedirectView> {
    constructor(readonly params: PublicExecuteParams<StartSignInRequest>) {
        super()
    }
}
