import { Injectable } from "@nestjs/common"
import type {
    AiRouterService,
    ChatCompletion,
    ChatCompletionChunk,
    ChatCompletionRequest,
    ChatStream,
    RouterEvents,
} from "@starci/ai-router"
import { InjectLogger } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { InjectLessonRouter } from "./ai-pool.decorators"
import { AiPoolError, AiPoolErrorCode } from "./errors/ai-pool.error"
import { InjectAiPoolOptions } from "./ai-pool.options-token"
import type { AiPoolOptions } from "./ai-pool.options"
import { AiPoolLogEvent } from "./ai-pool.log-events"
import type { LessonAi, LessonAiInput } from "./lesson-ai.port"

const PROFILE = "lesson" as const
const CHARS_PER_TOKEN = 4

@Injectable()
/** Applies lesson guardrails (profile, output limit, grounding fit) while routing, retries and fallback stay inside ai-router. */
export class LessonAiService implements LessonAi {
    constructor(
        @InjectLessonRouter() private readonly router: AiRouterService<"lesson">,
        @InjectAiPoolOptions() private readonly options: AiPoolOptions,
        @InjectLogger() private readonly logger: Logger,
    ) {
        this.router.on("attempt", (event) => this.logAttempt(event))
    }

    /** Runs one guarded lesson completion and returns the full reply. */
    async complete(input: LessonAiInput, signal?: AbortSignal): Promise<ChatCompletion> {
        const request = this.request(input)
        try {
            const reply = await this.router.chat(request, { profile: PROFILE, ...(signal ? { signal } : {}) })
            return reply
        } catch (cause) {
            this.logger.error(AiPoolLogEvent.RequestFailed, cause, { outcome: "failure" })
            throw cause
        }
    }

    /** Streams one guarded lesson completion; aborting the signal cancels the routed call. */
    stream(input: LessonAiInput, signal?: AbortSignal): AsyncIterable<ChatCompletionChunk> {
        const request = this.request(input)
        const stream = this.router.stream(request, { profile: PROFILE, ...(signal ? { signal } : {}) })
        return this.observe(stream)
    }

    private request(input: LessonAiInput): ChatCompletionRequest {
        const { maxOutputTokens, reservedPromptTokens } = this.options.limits
        const smallestWindow = Math.min(
            ...this.options.pool.providers.flatMap((provider) =>
                provider.models.map((model) => model.contextWindow ?? 0),
            ),
        )
        const groundingTokens = Math.ceil(input.grounding.length / CHARS_PER_TOKEN)
        if (groundingTokens + reservedPromptTokens + maxOutputTokens > smallestWindow)
            throw new AiPoolError({ code: AiPoolErrorCode.GroundingTooLarge })
        if (input.max_tokens !== undefined && (!Number.isInteger(input.max_tokens) || input.max_tokens <= 0))
            throw new AiPoolError({ code: AiPoolErrorCode.OutputLimitInvalid })
        const requestedTokens = input.max_tokens ?? maxOutputTokens
        const outputTokens = Math.min(requestedTokens, maxOutputTokens)
        const {
            grounding: _grounding,
            max_tokens: _maxTokens,
            max_completion_tokens: _maxCompletionTokens,
            profile: _profile,
            ...request
        } = input
        return {
            ...request,
            messages: [{ role: "developer", content: input.grounding }, ...input.messages],
            max_tokens: outputTokens,
            max_completion_tokens: outputTokens,
        }
    }

    private async *observe(stream: ChatStream): AsyncIterable<ChatCompletionChunk> {
        let usage: ChatCompletionChunk["usage"]
        try {
            for await (const chunk of stream) {
                if (chunk.usage) usage = chunk.usage
                yield chunk
            }
            this.logger.info(AiPoolLogEvent.RequestCompleted, {
                requestId: stream.requestId,
                outcome: "success",
                ...(usage?.total_tokens === undefined ? {} : { usageTotal: usage.total_tokens }),
            })
        } catch (cause) {
            this.logger.error(AiPoolLogEvent.RequestFailed, cause, { requestId: stream.requestId, outcome: "failure" })
            throw cause
        }
    }

    private logAttempt(event: RouterEvents["attempt"]): void {
        this.logger.info(AiPoolLogEvent.AttemptRecorded, {
            provider: event.provider,
            keyAlias: event.key,
            model: event.model,
            latencyMs: event.latencyMs,
            ...(event.usage === undefined ? {} : { usageTotal: event.usage.total_tokens }),
            outcome: event.outcome,
        })
    }
}
