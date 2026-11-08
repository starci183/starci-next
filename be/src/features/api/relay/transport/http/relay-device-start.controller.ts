import { Body, Controller, HttpCode, Post } from "@nestjs/common"
import type { CommandBus } from "@nestjs/cqrs"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RateLimit, RateTier } from "@modules/platform/http-security"
import { StartRelayPairingCommand } from "../../application/start-relay-pairing.command"
import { RelayDeviceStartRequest } from "./dto/relay-device-start.request"
import type { RelayDeviceStartResponse } from "./dto/relay-device-start.response"
import { toStartRelayPairingParams, toRelayDeviceStartResponse } from "./relay-device.mapper"

@Controller("api/relay/devices")
/** The device-start door of the learner relay's pairing handshake; it maps the body, dispatches one command and maps back. */
export class RelayDeviceStartController {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Opens a pairing for the learner CLI; the CLI shows the short code and the confirm page. */
    @Post("start")
    @HttpCode(200)
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    async start(@Body() body: RelayDeviceStartRequest): Promise<RelayDeviceStartResponse> {
        return toRelayDeviceStartResponse(
            await this.commandBus.execute(new StartRelayPairingCommand(toStartRelayPairingParams(body))),
        )
    }
}
