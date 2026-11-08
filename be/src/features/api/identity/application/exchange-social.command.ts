import { Command } from "@nestjs/cqrs"
import type { SocialSessionIssued } from "@modules/domain/identity"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { ExchangeSocialRequest } from "./exchange-social.contracts"

/** Dispatches the exchange-social operation without trusting client identity claims. */
export class ExchangeSocialCommand extends Command<SocialSessionIssued> {
    constructor(readonly params: PublicExecuteParams<ExchangeSocialRequest>) {
        super()
    }
}
