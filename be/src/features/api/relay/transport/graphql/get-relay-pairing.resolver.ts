import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetRelayPairingQuery } from "../../application/get-relay-pairing.query"
import { toGetRelayPairingParams, toRelayPairingType } from "./relay-device.mapper"
import { RelayUserCodeInput } from "./dto/relay-user-code.input"
import { RelayPairingType } from "./dto/relay-pairing.type"

@Resolver()
/** GraphQL door of relayPairing for the signed-in learner. */
export class GetRelayPairingResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the device name and platform of a pending pairing, so the learner sees what they confirm. */
    @Query(() => RelayPairingType, { name: "relayPairing" })
    async relayPairing(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RelayUserCodeInput,
    ): Promise<RelayPairingType> {
        const result = await this.queryBus.execute(new GetRelayPairingQuery(toGetRelayPairingParams(identity, input)))
        return toRelayPairingType(result)
    }
}
