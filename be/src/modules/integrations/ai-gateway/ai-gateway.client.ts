import { Injectable } from "@nestjs/common"
import type { AiRouterService, RouterEvents } from "@starci/ai-router"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { AiGatewayError, AiGatewayErrorCode } from "./errors/ai-gateway.error"
import { InjectAiGatewayOptions, InjectAiGatewayRouter } from "./ai-gateway.decorators"
import { AiGatewayLogEvent } from "./ai-gateway.log-events"
import type { AiGatewayModuleOptions, AiGatewayProfile } from "./ai-gateway.options"
import type { AiGateway, AiGatewayReply, AiGatewayRequest } from "./ai-gateway.port"

const DEFAULT_PROFILE: AiGatewayProfile = "coach"

@Injectable()
/** Completes one prompt as a JSON object through the pool; routing, retries, key health and model fallback stay inside the router. */
export class AiGatewayClient implements AiGateway {
    constructor(
        @InjectAiGatewayRouter() private readonly router: AiRouterService<AiGatewayProfile>,
        @InjectAiGatewayOptions() private readonly options: AiGatewayModuleOptions,
        @InjectLogger() private readonly logger: Logger,
    ) {
        this.router.on("attempt", (event) => this.recordAttempt(event))
    }

    /** Completes the prompt under the request deadline; a failed pool is AI_GATEWAY_UNAVAILABLE and an empty text is AI_GATEWAY_REPLY_EMPTY. */
    async complete(request: AiGatewayRequest): Promise<AiGatewayReply> {
        const profile = request.profile ?? DEFAULT_PROFILE
        const { text, model } = await this.textOf(request, profile)
        if (text.trim() === "") throw new AiGatewayError({ code: AiGatewayErrorCode.ReplyEmpty })
        const preferred = this.options.gateway?.pool.profiles?.[profile]?.model
        return { text, model, usedFallback: preferred !== undefined && preferred !== model }
    }

    private async textOf(
        request: AiGatewayRequest,
        profile: AiGatewayProfile,
    ): Promise<{ readonly text: string; readonly model: string }> {
        try {
            const reply = await this.router.chat(
                {
                    messages: [
                        { role: "system", content: request.system },
                        { role: "user", content: request.user },
                    ],
                    ...(this.options.gateway === null
                        ? {}
                        : { max_tokens: request.maxOutputTokens ?? this.options.gateway.maxOutputTokens }),
                    temperature: 0,
                    response_format: { type: "json_object" },
                },
                { profile, requestId: request.requestId, policy: { deadlineMs: request.timeoutMs } },
            )
            const content = reply.choices[0]?.message.content
            return { text: typeof content === "string" ? content : "", model: reply.routing.model }
        } catch (cause) {
            this.logger.error(AiGatewayLogEvent.CompletionFailed, cause, { requestId: request.requestId })
            throw new AiGatewayError({ code: AiGatewayErrorCode.Unavailable, cause })
        }
    }

    private recordAttempt(event: RouterEvents["attempt"]): void {
        this.logger.info(AiGatewayLogEvent.AttemptRecorded, {
            requestId: event.requestId,
            provider: event.provider,
            keyAlias: event.key,
            model: event.model,
            latencyMs: event.latencyMs,
            outcome: event.outcome,
            ...(event.errorClass === undefined ? {} : { errorClass: event.errorClass }),
            ...(event.usage === undefined ? {} : { usageTotal: event.usage.total_tokens }),
        })
    }
}
