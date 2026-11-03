import { Command } from "@nestjs/cqrs"
import type { IdentityLogoutResult } from "@modules/domain/identity"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { SignOutRequest } from "./sign-out.contracts"

/** Dispatches the sign-out operation without trusting client identity claims. */
export class SignOutCommand extends Command<IdentityLogoutResult> {
    constructor(readonly params: PublicExecuteParams<SignOutRequest>) {
        super()
    }
}
