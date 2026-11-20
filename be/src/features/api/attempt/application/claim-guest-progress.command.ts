import { Command } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ClaimGuestProgressRequest, ClaimGuestProgressResult } from "./claim-guest-progress.contracts"

/** Merges what a guest did on the device into the signed-in learner, once. */
export class ClaimGuestProgressCommand extends Command<ClaimGuestProgressResult> {
    constructor(readonly params: ExecuteParams<ClaimGuestProgressRequest>) {
        super()
    }
}
