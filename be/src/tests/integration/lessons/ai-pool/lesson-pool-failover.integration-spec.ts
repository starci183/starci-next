import { AiRouterService } from "@starci/ai-router"
import type { PoolConfig } from "@starci/ai-router"
import { createFakeProvider } from "@starci/ai-router/testing"
import type { FakeProvider } from "@starci/ai-router/testing"
import { AiPoolModule, LESSON_AI } from "@modules/integrations/ai-pool"
import type { LessonAi, LessonAiInput } from "@modules/integrations/ai-pool"
import { useTestWorld } from "../../../world/use-test-world"

/**
 * lessons/ai-pool: the real AiPoolModule composed in the modules world, routing to the ai-router fake provider at the
 * network edge. A rate-limited key moves the call to the next key, a provider that stops answering moves it to another
 * provider, and the lesson profile's ordered fallback serves when the preferred model is exhausted.
 */

const PRIMARY_URL = "https://api.deepseek.com"
const STANDBY_URL = "https://standby-provider.example.com/v1"

const pool: PoolConfig<"lesson"> = {
    providers: [
        {
            id: "deepseek",
            baseUrl: PRIMARY_URL,
            maxConcurrency: 8,
            keys: [
                { alias: "lesson-primary", resolve: () => "test-primary-key", maxConcurrency: 4 },
                { alias: "lesson-fallback-1", resolve: () => "test-fallback-key", maxConcurrency: 4 },
            ],
            models: [
                { id: "deepseek-flash", aliases: ["deepseek-4.1-flash"], contextWindow: 1_000_000 },
                { id: "deepseek-v4-pro", contextWindow: 1_000_000 },
            ],
        },
        {
            id: "standby",
            baseUrl: STANDBY_URL,
            maxConcurrency: 8,
            keys: [{ alias: "standby-1", resolve: () => "test-standby-key", maxConcurrency: 4 }],
            models: [{ id: "deepseek-v4-pro", contextWindow: 1_000_000 }],
        },
    ],
    defaults: { maxAttempts: 4, timeoutMs: 5_000, deadlineMs: 15_000 },
    profiles: {
        lesson: {
            model: "deepseek-4.1-flash",
            fallbacks: ["deepseek-v4-pro"],
            allowFallback: true,
            maxAttempts: 4,
            timeoutMs: 5_000,
            deadlineMs: 15_000,
        },
    },
    resilience: {
        keyBreaker: { failureThreshold: 20 },
        providerBreaker: { failureThreshold: 20 },
        backoff: { baseMs: 5, factor: 2, maxMs: 10 },
    },
    telemetry: { includeContent: false },
}

const input = (overrides: Partial<LessonAiInput> = {}): LessonAiInput => ({
    messages: [{ role: "user", content: "Explain the lesson section." }],
    grounding: "The section explains REST verb semantics.",
    ...overrides,
})

/** The lanes a failure names, read off the router error's `attempts` without a type assertion. */
const attemptLanes = (failure: unknown): ReadonlyArray<Record<string, unknown>> => {
    if (typeof failure !== "object" || failure === null || !("attempts" in failure)) return []
    const attempts: unknown = failure.attempts
    if (!Array.isArray(attempts)) return []
    return attempts.filter(
        (attempt): attempt is Record<string, unknown> => typeof attempt === "object" && attempt !== null,
    )
}

const movesRateLimitedKey = async (lessonAi: LessonAi, fake: FakeProvider, router: AiRouterService<"lesson">): Promise<void> => {
    fake.on({ key: "test-primary-key" }, { status: 429, headers: { "retry-after": "30" } })
    fake.on(
        { key: "test-fallback-key" },
        {
            text: "answered by the second key",
            usage: { prompt_tokens: 10, completion_tokens: 3, total_tokens: 13 },
        },
    )

    const reply = await lessonAi.complete(input())

    expect(reply.choices[0]?.message.content).toBe("answered by the second key")
    expect(reply.routing).toMatchObject({
        provider: "deepseek",
        key: "lesson-fallback-1",
        model: "deepseek-flash",
        attempts: 2,
    })
    expect(fake.calls.map((call) => call.key)).toEqual(["test-primary-key", "test-fallback-key"])
    expect(fake.calls[0]?.headers.authorization).toBe("Bearer test-primary-key")
    expect(fake.calls[1]?.headers.authorization).toBe("Bearer test-fallback-key")
    expect(fake.calls[0]?.headers["x-request-id"]).toBe(reply.routing.requestId)

    const health = await router.health()
    const limitedLane = health.providers
        .find((provider) => provider.id === "deepseek")
        ?.keys.find((key) => key.alias === "lesson-primary")
        ?.models.find((lane) => lane.model === "deepseek-flash")
    expect(limitedLane?.cooldownUntil).toBeGreaterThan(0)
}

const movesProviderOutage = async (lessonAi: LessonAi, fake: FakeProvider): Promise<void> => {
    fake.on({ baseUrl: PRIMARY_URL }, { error: "network" })
    fake.on({ baseUrl: STANDBY_URL }, { text: "the standby provider answered" })

    const reply = await lessonAi.complete(input())

    expect(reply.choices[0]?.message.content).toBe("the standby provider answered")
    expect(reply.routing).toMatchObject({ provider: "standby", key: "standby-1", model: "deepseek-v4-pro" })
    expect(fake.calls.map((call) => call.model)).toEqual(["deepseek-flash", "deepseek-flash", "deepseek-v4-pro"])
    expect(fake.calls.map((call) => new URL(call.url).origin)).toEqual([
        "https://api.deepseek.com",
        "https://api.deepseek.com",
        "https://standby-provider.example.com",
    ])
    expect(
        fake.calls
            .slice(0, 2)
            .map((call) => call.key)
            .sort((left, right) => left.localeCompare(right)),
    ).toEqual(["test-fallback-key", "test-primary-key"])
    expect(fake.calls[2]?.headers.authorization).toBe("Bearer test-standby-key")
}

const exhaustsPreferredFirst = async (lessonAi: LessonAi, fake: FakeProvider): Promise<void> => {
    fake.on({ model: "deepseek-flash" }, { status: 503 })
    fake.on({ model: "deepseek-v4-pro" }, { text: "the pro model answered" })

    const reply = await lessonAi.complete(input())

    expect(reply.choices[0]?.message.content).toBe("the pro model answered")
    expect(reply.routing.model).toBe("deepseek-v4-pro")
    expect(fake.calls.map((call) => call.model)).toEqual(["deepseek-flash", "deepseek-flash", "deepseek-v4-pro"])
}

const redactsFailureTelemetry = async (lessonAi: LessonAi, fake: FakeProvider): Promise<void> => {
    fake.on({}, { status: 503, body: { error: { message: "upstream echoed test-primary-key" } } })

    const failure: unknown = await lessonAi.complete(input()).catch((error: unknown) => error)

    expect(failure).toMatchObject({ errorClass: "transient", status: 503 })
    expect(attemptLanes(failure).map((lane) => `${String(lane.provider)}:${String(lane.key)}`)).toEqual(
        expect.arrayContaining(["deepseek:lesson-primary", "deepseek:lesson-fallback-1"]),
    )
    expect(fake.calls.length).toBeGreaterThan(0)
    expect(fake.calls.every((call) => !("user" in call.body))).toBe(true)
    expect(JSON.stringify(failure)).toContain("[redacted]")
    expect(JSON.stringify(failure)).not.toContain("test-fallback-key")
    expect(JSON.stringify(failure)).not.toContain("test-standby-key")
}

const refusesOversizedGrounding = async (lessonAi: LessonAi, fake: FakeProvider): Promise<void> => {
    await expect(lessonAi.complete(input({ grounding: "x".repeat(4_000_001) }))).rejects.toThrow(
        "AI_POOL_GROUNDING_TOO_LARGE",
    )

    expect(fake.calls).toHaveLength(0)
}

describe("lesson AI pool: key, provider and model failover (integration)", () => {
    const fake = createFakeProvider()
    const world = useTestWorld({
        modules: [
            () =>
                AiPoolModule.register({
                    pool: { ...pool, fetch: fake.fetch, random: () => 0.5 },
                    limits: { maxOutputTokens: 1024, reservedPromptTokens: 2048 },
                }),
        ],
    })

    const lessonAi = (): LessonAi => world.resolve<LessonAi>(LESSON_AI)
    const router = (): AiRouterService<"lesson"> => world.resolve<AiRouterService<"lesson">>(AiRouterService)

    beforeEach(async () => {
        fake.reset()
        await router().reset()
    })

    it("moves a rate-limited key's call to the next key and names the answering lane by alias", () =>
        movesRateLimitedKey(lessonAi(), fake, router()))

    it("moves the call to the other provider when the first stops answering, without retrying the dead host", () =>
        movesProviderOutage(lessonAi(), fake))

    it("exhausts the preferred model on every key before it serves the profile's fallback model", () =>
        exhaustsPreferredFirst(lessonAi(), fake))

    it("sends no learner identity field and names lanes by alias while redacting an echoed secret in a failure", () =>
        redactsFailureTelemetry(lessonAi(), fake))

    it("refuses grounding that cannot fit the smallest model window without a provider call", () =>
        refusesOversizedGrounding(lessonAi(), fake))
})
