import { Command } from "@nestjs/cqrs"
import type { SocialStarted } from "@modules/domain/identity"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { StartSocialRequest } from "./start-social.contracts"

/** Dispatches the start-social operation without trusting client identity claims. */
export class StartSocialCommand extends Command<SocialStarted> {
    constructor(readonly params: PublicExecuteParams<StartSocialRequest>) {
        super()
    }
}
