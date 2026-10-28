import { Test } from "@nestjs/testing"
import { builder, mock } from "@starci/jest-preset"
import { AiRouterService, createRouter } from "@starci/ai-router"
import { createFakeProvider } from "@starci/ai-router/testing"
import type { FakeProvider } from "@starci/ai-router/testing"
import { LOGGER } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import type { AiPoolOptions } from "./ai-pool.options"
import { AI_POOL_OPTIONS } from "./ai-pool.decorators"
import type { LessonAiInput } from "./lesson-ai.port"
import { LessonAiService } from "./lesson-ai.service"

const flash = { id: "deepseek/deepseek-v4.1-flash", contextWindow: 1_048_576 }
const pro = { id: "deepseek/deepseek-v4-pro", contextWindow: 1_048_576 }
const openrouter = {
    id: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    maxConcurrency: 8,
    keys: [
        { alias: "openrouter-primary", resolve: () => "test-primary", maxConcurrency: 4 },
        { alias: "openrouter-secondary", resolve: () => "test-fallback", maxConcurrency: 4 },
    ],
    models: [flash, pro],
}
const defaults: AiPoolOptions = {
    pool: {
        providers: [openrouter],
        defaults: { maxAttempts: 4, timeoutMs: 30000, deadlineMs: 60000 },
        profiles: {
            lesson: {
                model: "deepseek/deepseek-v4.1-flash",
                fallbacks: ["deepseek/deepseek-v4-pro"],
                allowFallback: true,
                maxAttempts: 4,
                timeoutMs: 30000,
                deadlineMs: 60000,
            },
        },
        telemetry: { includeContent: false },
    },
    limits: { maxOutputTokens: 1024, reservedPromptTokens: 2048 },
}

const build = async (fake: FakeProvider, overrides?: Partial<AiPoolOptions>) => {
    const options = builder<AiPoolOptions>(defaults)(overrides)
    const logger = mock<Logger>()
    const real = new AiRouterService<"lesson">(
        createRouter<"lesson">({ ...options.pool, fetch: fake.fetch, random: () => 0.5 }),
    )
    const router = mock<AiRouterService<"lesson">>({
        chat: (request, call) => real.chat(request, call),
        stream: (request, call) => real.stream(request, call),
        on: (event, handler) => real.on(event, handler),
        onApplicationShutdown: () => real.onApplicationShutdown(),
    })
    const moduleRef = await Test.createTestingModule({
        providers: [
            LessonAiService,
            { provide: AiRouterService, useValue: router },
            { provide: AI_POOL_OPTIONS, useValue: options },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    await moduleRef.init()
    return { service: moduleRef.get(LessonAiService), router, logger, moduleRef }
}

const input = (overrides: Partial<LessonAiInput> = {}): LessonAiInput => ({
    messages: [{ role: "user", content: "Explain this code" }],
    grounding: "small grounding",
    ...overrides,
})

const drain = async (stream: AsyncIterable<unknown>): Promise<void> => {
    for await (const _chunk of stream) {
        /* consume */
    }
}

describe("LessonAiService.complete", () => {
    it("caps an oversized caller limit and logs content-free routing telemetry", async () => {
        const fake = createFakeProvider()
        const { service, logger, moduleRef } = await build(fake)
        await service.complete(input({ max_tokens: 5000 }))
        const call = fake.calls[0]
        expect(call?.body.max_tokens).toBe(1024)
        expect(call?.body.max_completion_tokens).toBe(1024)
        expect(JSON.stringify(call?.body.messages)).toContain("small grounding")
        expect(logger.info).toHaveBeenCalledWith(
            "ai_pool.attempt_recorded",
            expect.objectContaining({
                provider: "openrouter",
                keyAlias: "openrouter-primary",
                model: "deepseek/deepseek-v4.1-flash",
                outcome: "success",
            }),
        )
        expect(JSON.stringify(logger.info.mock.calls)).not.toContain("Explain this code")
        await moduleRef.close()
    })

    it("uses the configured limit when the caller omits max_tokens", async () => {
        const fake = createFakeProvider()
        const { service, moduleRef } = await build(fake)
        await service.complete(input())
        expect(fake.calls[0]?.body.max_tokens).toBe(1024)
        await moduleRef.close()
    })

    it("preserves a valid caller token limit", async () => {
        const fake = createFakeProvider()
        const { service, moduleRef } = await build(fake)
        await service.complete(input({ max_tokens: 256 }))
        expect(fake.calls[0]?.body.max_tokens).toBe(256)
        await moduleRef.close()
    })

    it("rejects non-positive and fractional caller token limits before calling the router", async () => {
        const fake = createFakeProvider()
        const { service, moduleRef } = await build(fake)
        await expect(service.complete(input({ max_tokens: 0 }))).rejects.toThrow("AI_POOL_OUTPUT_LIMIT_INVALID")
        await expect(service.complete(input({ max_tokens: 1.5 }))).rejects.toThrow("AI_POOL_OUTPUT_LIMIT_INVALID")
        expect(fake.calls).toHaveLength(0)
        await moduleRef.close()
    })

    it("forwards the caller signal on unary calls", async () => {
        const fake = createFakeProvider()
        const { service, router, moduleRef } = await build(fake)
        const chatSpy = jest.spyOn(router, "chat")
        const controller = new AbortController()
        await service.complete(input(), controller.signal)
        expect(chatSpy.mock.calls[0]?.[1]?.signal).toBe(controller.signal)
        await moduleRef.close()
    })

    it("logs failures without learner or prompt fields", async () => {
        const fake = createFakeProvider()
        fake.on({}, { status: 400 })
        const { service, logger, moduleRef } = await build(fake)
        await expect(service.complete(input())).rejects.toThrow()
        expect(logger.error).toHaveBeenCalledWith("ai_pool.request_failed", expect.anything(), { outcome: "failure" })
        expect(JSON.stringify(logger.error.mock.calls)).not.toContain("small grounding")
        await moduleRef.close()
    })
})

describe("LessonAiService grounding", () => {
    it("refuses grounding that cannot fit the smallest configured context", async () => {
        const fake = createFakeProvider()
        const { service, moduleRef } = await build(fake)
        await expect(service.complete(input({ grounding: "x".repeat(4_200_000) }))).rejects.toThrow(
            "AI_POOL_GROUNDING_TOO_LARGE",
        )
        expect(fake.calls).toHaveLength(0)
        await moduleRef.close()
    })

    it("refuses grounding when a configured model declares no context window", async () => {
        const fake = createFakeProvider()
        const { service, moduleRef } = await build(fake, {
            pool: {
                ...defaults.pool,
                providers: [{ ...openrouter, models: [flash, { id: "deepseek/deepseek-v4-pro" }] }],
            },
        })
        await expect(service.complete(input())).rejects.toThrow("AI_POOL_GROUNDING_TOO_LARGE")
        expect(fake.calls).toHaveLength(0)
        await moduleRef.close()
    })
})

describe("LessonAiService.stream", () => {
    it("passes streaming and cancellation options through the router", async () => {
        const fake = createFakeProvider()
        fake.on({}, { stream: { chunks: ["one", "two"], delayMs: 40 } })
        const { service, router, moduleRef } = await build(fake)
        const controller = new AbortController()
        const streamSpy = jest.spyOn(router, "stream")
        const iterator = service.stream(input(), controller.signal)[Symbol.asyncIterator]()
        expect(streamSpy.mock.calls[0]?.[1]?.signal).toBe(controller.signal)
        expect((await iterator.next()).done).toBe(false)
        controller.abort()
        await iterator.return?.()
        expect((await iterator.next()).done).toBe(true)
        expect(fake.calls[0]?.stream).toBe(true)
        expect(fake.calls[0]?.body.max_tokens).toBe(1024)
        await moduleRef.close()
    })

    it("records stream usage without logging prompt content", async () => {
        const fake = createFakeProvider()
        fake.on({}, { stream: { chunks: ["answer"] } })
        const { service, logger, moduleRef } = await build(fake)
        await drain(service.stream(input()))
        expect(logger.info).toHaveBeenCalledWith(
            "ai_pool.request_completed",
            expect.objectContaining({ outcome: "success" }),
        )
        expect(JSON.stringify(logger.info.mock.calls)).not.toContain("small grounding")
        await moduleRef.close()
    })

    it("omits token totals when the stream carries no usage", async () => {
        const fake = createFakeProvider()
        fake.on({}, { stream: { chunks: ["a"], includeUsage: false } })
        const { service, router, logger, moduleRef } = await build(fake)
        const streamSpy = jest.spyOn(router, "stream")
        await drain(service.stream(input()))
        const routed = streamSpy.mock.results[0]
        expect(logger.info).toHaveBeenCalledWith("ai_pool.request_completed", {
            requestId: routed?.type === "return" ? routed.value.requestId : undefined,
            outcome: "success",
        })
        await moduleRef.close()
    })

    it("logs a failed stream without prompt content and rethrows", async () => {
        const fake = createFakeProvider()
        fake.on({}, { status: 400 })
        const { service, logger, moduleRef } = await build(fake)
        await expect(drain(service.stream(input()))).rejects.toThrow()
        expect(logger.error).toHaveBeenCalledWith(
            "ai_pool.request_failed",
            expect.anything(),
            expect.objectContaining({ outcome: "failure" }),
        )
        expect(JSON.stringify(logger.error.mock.calls)).not.toContain("small grounding")
        await moduleRef.close()
    })
})

describe("LessonAiService failover", () => {
    it("lets the router fail over between configured keys", async () => {
        const fake = createFakeProvider()
        fake.on({ key: "test-primary" }, { status: 401 })
        const { service, moduleRef } = await build(fake)
        await service.complete(input())
        expect(fake.calls.map((call) => call.key)).toContain("test-fallback")
        await moduleRef.close()
    })

    it("lets the router fail over between configured providers", async () => {
        const fake = createFakeProvider()
        const secondary = { ...openrouter, id: "openrouter-secondary", baseUrl: "https://secondary.test/v1" }
        fake.on({ baseUrl: "https://openrouter.ai/api/v1" }, { status: 401 })
        fake.on({ baseUrl: "https://secondary.test/v1" }, { text: "fallback provider" })
        const { service, moduleRef } = await build(fake, {
            pool: { ...defaults.pool, providers: [openrouter, secondary] },
        })
        await service.complete(input())
        expect(fake.calls.map((call) => new URL(call.url).origin)).toContain("https://secondary.test")
        await moduleRef.close()
    })

    it("leaves ordered model fallback to the router", async () => {
        const fake = createFakeProvider()
        fake.on({ model: "deepseek/deepseek-v4.1-flash" }, { status: 503 })
        const { service, moduleRef } = await build(fake)
        await service.complete(input())
        expect(fake.calls.map((call) => call.model)).toContain("deepseek/deepseek-v4-pro")
        await moduleRef.close()
    })
})
