import { Injectable } from "@nestjs/common"
import { AiGatewayError, AiGatewayErrorCode } from "./errors/ai-gateway.error"
import type { AiGateway, AiGatewayReply } from "./ai-gateway.port"

@Injectable()
/** The gateway of an instance that declared no OpenRouter key: it completes nothing and says so with a stable code. */
export class UnconfiguredAiGatewayClient implements AiGateway {
    /** Always refuses with AI_GATEWAY_NOT_CONFIGURED. */
    complete(): Promise<AiGatewayReply> {
        return Promise.reject(new AiGatewayError({ code: AiGatewayErrorCode.NotConfigured }))
    }
}
