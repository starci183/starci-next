import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RateLimit, RateTier } from "@modules/platform/http-security"
import { ClaimRelayPairCodeCommand } from "../../application/claim-relay-pair-code.command"
import { ClaimRelayPairCodeInput } from "./dto/relay-pair-code.input"
import { ClaimedRelayDeviceTokenType } from "./dto/relay-pair-code.type"

@Resolver()
/** GraphQL door of the CLI side of the six-digit pairing: no credential yet, so it is public and strictly rate limited. */
export class ClaimRelayPairCodeResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Exchanges a live six-digit code for a new device and its token, once. */
    @Mutation(() => ClaimedRelayDeviceTokenType, { name: "claimRelayPairCode" })
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    async claimRelayPairCode(@Args("input") input: ClaimRelayPairCodeInput): Promise<ClaimedRelayDeviceTokenType> {
        return this.commandBus.execute(
            new ClaimRelayPairCodeCommand({
                request: { code: input.code, deviceName: input.deviceName, platform: input.platform },
            }),
        )
    }
}
