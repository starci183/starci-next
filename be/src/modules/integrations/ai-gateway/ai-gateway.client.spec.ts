import { Test } from "@nestjs/testing"
import { builder, mock } from "@starci/jest-preset"
import { AiRouterService, type AttemptEvent, type ChatChoice, type ChatCompletion } from "@starci/ai-router"
import { LOGGER } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { AiGatewayClient } from "./ai-gateway.client"
import { AI_GATEWAY_OPTIONS } from "./ai-gateway.decorators"
import { AiGatewayLogEvent } from "./ai-gateway.log-events"
import type { AiGatewayModuleOptions, AiGatewayProfile } from "./ai-gateway.options"
import { AiGatewayErrorCode } from "./errors/ai-gateway.error"

const OPTIONS: AiGatewayModuleOptions = {
    gateway: {
        pool: {
            providers: [],
            profiles: { coach: { model: "m" }, interview: { model: "pro", fallbacks: ["m"] } },
        },
        maxOutputTokens: 777,
    },
}
const REQUEST = { requestId: "req-1", system: "rules", user: "data", timeoutMs: 60000 }

const completionOf = (choices: ReadonlyArray<ChatChoice>, model = "m"): ChatCompletion => ({
    id: "gen-1",
    object: "chat.completion",
    created: 1,
    model,
    choices,
    routing: { requestId: "req-1", provider: "openrouter", key: "k", model, attempts: 1, latencyMs: 1 },
})

const replyOf = (content: string | null, model = "m"): ChatCompletion =>
    completionOf([{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }], model)

const build = async (overrides: Partial<AiGatewayModuleOptions> = {}) => {
    const router = mock<AiRouterService<AiGatewayProfile>>()
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            AiGatewayClient,
            { provide: AiRouterService, useValue: router },
            { provide: AI_GATEWAY_OPTIONS, useValue: builder<AiGatewayModuleOptions>(OPTIONS)(overrides) },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { client: moduleRef.get(AiGatewayClient), router, logger }
}

describe("AiGatewayClient complete", () => {
    it("asks the coach profile for a JSON object under the request deadline and answers the text", async () => {
        const { client, router } = await build()
        router.chat.mockResolvedValue(replyOf('{"criteria":[]}'))

        await expect(client.complete(REQUEST)).resolves.toEqual({
            text: '{"criteria":[]}',
            model: "m",
            usedFallback: false,
        })

        expect(router.chat).toHaveBeenCalledWith(
            {
                messages: [
                    { role: "system", content: "rules" },
                    { role: "user", content: "data" },
                ],
                max_tokens: 777,
                temperature: 0,
                response_format: { type: "json_object" },
            },
            { profile: "coach", requestId: "req-1", policy: { deadlineMs: 60000 } },
        )
    })

    it("asks the profile and the output ceiling the request names, and reports a fallback that answered", async () => {
        const { client, router } = await build()
        router.chat.mockResolvedValue(replyOf("{}", "m"))

        await expect(client.complete({ ...REQUEST, profile: "interview", maxOutputTokens: 6000 })).resolves.toEqual({
            text: "{}",
            model: "m",
            usedFallback: true,
        })

        expect(router.chat.mock.calls[0]?.[0]).toMatchObject({ max_tokens: 6000 })
        expect(router.chat.mock.calls[0]?.[1]).toMatchObject({ profile: "interview" })
    })

    it("reports no fallback when the pool declares no profile", async () => {
        const { client, router } = await build({ gateway: null })
        router.chat.mockResolvedValue(replyOf("{}"))

        await expect(client.complete(REQUEST)).resolves.toMatchObject({ usedFallback: false })
    })

    it.each([
        ["blank text", replyOf("  ")],
        ["a non-text content", replyOf(null)],
        ["no choice", completionOf([])],
    ])("fails with AI_GATEWAY_REPLY_EMPTY on %s", async (_case, reply) => {
        const { client, router } = await build()
        router.chat.mockResolvedValue(reply)

        await expect(client.complete(REQUEST)).rejects.toMatchObject({ code: AiGatewayErrorCode.ReplyEmpty })
    })

    it("fails with AI_GATEWAY_UNAVAILABLE and logs the failure when the pool fails", async () => {
        const { client, router, logger } = await build()
        const cause = new Error("pool down")
        router.chat.mockRejectedValue(cause)

        await expect(client.complete(REQUEST)).rejects.toMatchObject({ code: AiGatewayErrorCode.Unavailable })

        expect(logger.error).toHaveBeenCalledWith(AiGatewayLogEvent.CompletionFailed, cause, { requestId: "req-1" })
    })
})

describe("AiGatewayClient complete without a pool ceiling", () => {
    it("leaves the output limit to the provider when no pool is declared", async () => {
        const { client, router } = await build({ gateway: null })
        router.chat.mockResolvedValue(replyOf("{}"))

        await client.complete(REQUEST)

        expect(router.chat.mock.calls[0]?.[0]).not.toHaveProperty("max_tokens")
    })
})

describe("AiGatewayClient attempt telemetry", () => {
    const base: AttemptEvent = {
        type: "attempt",
        requestId: "req-1",
        operation: "chat",
        attempt: 1,
        provider: "openrouter",
        key: "openrouter-primary",
        model: "m",
        latencyMs: 12,
        outcome: "success",
    }
    const logged = {
        requestId: "req-1",
        provider: "openrouter",
        keyAlias: "openrouter-primary",
        model: "m",
        latencyMs: 12,
    }

    const recordedBy = async (event: AttemptEvent) => {
        const { router, logger } = await build()
        const [, handler] = router.on.mock.calls[0] ?? []
        handler?.(event)
        return { subscribed: router.on.mock.calls[0]?.[0], logger }
    }

    it("records a successful attempt with its usage and no content", async () => {
        const { subscribed, logger } = await recordedBy({ ...base, usage: { prompt_tokens: 1, total_tokens: 5 } })

        expect(subscribed).toBe("attempt")
        expect(logger.info).toHaveBeenCalledWith(AiGatewayLogEvent.AttemptRecorded, {
            ...logged,
            outcome: "success",
            usageTotal: 5,
        })
    })

    it("records a failed attempt with its error class", async () => {
        const { logger } = await recordedBy({ ...base, outcome: "failure", errorClass: "auth" })

        expect(logger.info).toHaveBeenCalledWith(AiGatewayLogEvent.AttemptRecorded, {
            ...logged,
            outcome: "failure",
            errorClass: "auth",
        })
    })
})
