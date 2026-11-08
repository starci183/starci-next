import { Command } from "@nestjs/cqrs"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { ResendCodeRequest } from "./resend-code.contracts"

/** Dispatches the resend-code operation without trusting client identity claims. */
export class ResendCodeCommand extends Command<void> {
    constructor(readonly params: PublicExecuteParams<ResendCodeRequest>) {
        super()
    }
}
