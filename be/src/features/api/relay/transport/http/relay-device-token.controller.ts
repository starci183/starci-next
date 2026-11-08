import { Body, Controller, HttpCode, Post } from "@nestjs/common"
import type { CommandBus } from "@nestjs/cqrs"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RateLimit, RateTier } from "@modules/platform/http-security"
import { TakeRelayTokenCommand } from "../../application/take-relay-token.command"
import { RelayDeviceTokenRequest } from "./dto/relay-device-token.request"
import type { RelayDeviceTokenResponse } from "./dto/relay-device-token.response"
import { toTakeRelayTokenParams, toRelayDeviceTokenResponse } from "./relay-device.mapper"

@Controller("api/relay/devices")
/** The device-token door of the learner relay's pairing handshake; it maps the body, dispatches one command and maps back. */
export class RelayDeviceTokenController {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Answers the device token once the learner confirmed; the CLI polls it until then. */
    @Post("token")
    @HttpCode(200)
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    async token(@Body() body: RelayDeviceTokenRequest): Promise<RelayDeviceTokenResponse> {
        return toRelayDeviceTokenResponse(
            await this.commandBus.execute(new TakeRelayTokenCommand(toTakeRelayTokenParams(body))),
        )
    }
}
