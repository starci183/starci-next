import { AiPoolModule, LESSON_AI } from "@modules/integrations/ai-pool"
import type { AiPoolOptions, LessonAi, LessonAiInput } from "@modules/integrations/ai-pool"
import { lessonAiPoolFakeProvider, lessonAiPoolHealthStore } from "../../world/test-apps.options"
import type { LessonAiPoolFake, LessonAiPoolHealthStore } from "../../world/test-apps.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * lesson-ai-pool: the real AiPoolModule composed in the modules world, routing to the fake provider at the network
 * edge. A rate-limited key moves the call to the next key, a provider that stops answering moves it to another
 * provider, and the lesson profile's ordered fallback serves when the preferred model is exhausted.
 */

const PRIMARY_URL = "https://openrouter.ai/api/v1"
const STANDBY_URL = "https://standby-provider.example.com/v1"
const STORE_NAMESPACE = "lesson-failover"
const PRIMARY_LANE = `${STORE_NAMESPACE}:lane:openrouter/openrouter-primary/deepseek/deepseek-v4.1-flash`

const pool: AiPoolOptions["pool"] = {
    providers: [
        {
            id: "openrouter",
            baseUrl: PRIMARY_URL,
            maxConcurrency: 8,
            keys: [
                { alias: "openrouter-primary", resolve: () => "test-primary-key", maxConcurrency: 4 },
                { alias: "openrouter-secondary", resolve: () => "test-fallback-key", maxConcurrency: 4 },
            ],
            models: [
                { id: "deepseek/deepseek-v4.1-flash", contextWindow: 1_048_576 },
                { id: "deepseek/deepseek-v4-pro", contextWindow: 1_048_576 },
            ],
        },
        {
            id: "standby",
            baseUrl: STANDBY_URL,
            maxConcurrency: 8,
            keys: [{ alias: "standby-1", resolve: () => "test-standby-key", maxConcurrency: 4 }],
            models: [{ id: "deepseek/deepseek-v4-pro", contextWindow: 1_048_576 }],
        },
    ],
    defaults: { maxAttempts: 4, timeoutMs: 5_000, deadlineMs: 15_000 },
    profiles: {
        lesson: {
            model: "deepseek/deepseek-v4.1-flash",
            fallbacks: ["deepseek/deepseek-v4-pro"],
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
    storeNamespace: STORE_NAMESPACE,
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

const movesRateLimitedKey = async (
    lessonAi: LessonAi,
    fake: LessonAiPoolFake,
    store: LessonAiPoolHealthStore,
): Promise<void> => {
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
        provider: "openrouter",
        key: "openrouter-secondary",
        model: "deepseek/deepseek-v4.1-flash",
        attempts: 2,
    })
    expect(fake.calls.map((call) => call.key)).toEqual(["test-primary-key", "test-fallback-key"])
    expect(fake.calls[0]?.headers.authorization).toBe("Bearer test-primary-key")
    expect(fake.calls[1]?.headers.authorization).toBe("Bearer test-fallback-key")
    expect(fake.calls[0]?.headers["x-request-id"]).toBe(reply.routing.requestId)

    const limitedLane = await store.get(PRIMARY_LANE)
    expect(limitedLane?.cooldownUntil).toBeGreaterThan(0)
}

const movesProviderOutage = async (lessonAi: LessonAi, fake: LessonAiPoolFake): Promise<void> => {
    fake.on({ baseUrl: PRIMARY_URL }, { error: "network" })
    fake.on({ baseUrl: STANDBY_URL }, { text: "the standby provider answered" })

    const reply = await lessonAi.complete(input())

    expect(reply.choices[0]?.message.content).toBe("the standby provider answered")
    expect(reply.routing).toMatchObject({ provider: "standby", key: "standby-1", model: "deepseek/deepseek-v4-pro" })
    expect(fake.calls.map((call) => call.model)).toEqual([
        "deepseek/deepseek-v4.1-flash",
        "deepseek/deepseek-v4.1-flash",
        "deepseek/deepseek-v4-pro",
    ])
    expect(fake.calls.map((call) => new URL(call.url).origin)).toEqual([
        "https://openrouter.ai",
        "https://openrouter.ai",
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

const exhaustsPreferredFirst = async (lessonAi: LessonAi, fake: LessonAiPoolFake): Promise<void> => {
    fake.on({ model: "deepseek/deepseek-v4.1-flash" }, { status: 503 })
    fake.on({ model: "deepseek/deepseek-v4-pro" }, { text: "the pro model answered" })

    const reply = await lessonAi.complete(input())

    expect(reply.choices[0]?.message.content).toBe("the pro model answered")
    expect(reply.routing.model).toBe("deepseek/deepseek-v4-pro")
    expect(fake.calls.map((call) => call.model)).toEqual([
        "deepseek/deepseek-v4.1-flash",
        "deepseek/deepseek-v4.1-flash",
        "deepseek/deepseek-v4-pro",
    ])
}

const redactsFailureTelemetry = async (lessonAi: LessonAi, fake: LessonAiPoolFake): Promise<void> => {
    fake.on({}, { status: 503, body: { error: { message: "upstream echoed test-primary-key" } } })

    const failure: unknown = await lessonAi.complete(input()).catch((error: unknown) => error)

    expect(failure).toMatchObject({ errorClass: "transient", status: 503 })
    expect(attemptLanes(failure).map((lane) => `${String(lane.provider)}:${String(lane.key)}`)).toEqual(
        expect.arrayContaining(["openrouter:openrouter-primary", "openrouter:openrouter-secondary"]),
    )
    expect(fake.calls.length).toBeGreaterThan(0)
    expect(fake.calls.every((call) => !("user" in call.body))).toBe(true)
    expect(JSON.stringify(failure)).toContain("[redacted]")
    expect(JSON.stringify(failure)).not.toContain("test-fallback-key")
    expect(JSON.stringify(failure)).not.toContain("test-standby-key")
}

const refusesOversizedGrounding = async (lessonAi: LessonAi, fake: LessonAiPoolFake): Promise<void> => {
    await expect(lessonAi.complete(input({ grounding: "x".repeat(4_200_000) }))).rejects.toThrow(
        "AI_POOL_GROUNDING_TOO_LARGE",
    )

    expect(fake.calls).toHaveLength(0)
}

describe("lesson AI pool: key, provider and model failover (integration)", () => {
    const fake = lessonAiPoolFakeProvider()
    const store = lessonAiPoolHealthStore()
    const world = useTestWorld({
        modules: [
            () =>
                AiPoolModule.register({
                    pool: { ...pool, fetch: fake.fetch, random: () => 0.5, store },
                    limits: { maxOutputTokens: 1024, reservedPromptTokens: 2048 },
                }),
        ],
    })

    const lessonAi = (): LessonAi => world.resolve<LessonAi>(LESSON_AI)

    beforeEach(() => {
        fake.reset()
        store.clear()
    })

    it("moves a rate-limited key's call to the next key and names the answering lane by alias", () =>
        movesRateLimitedKey(lessonAi(), fake, store))

    it("moves the call to the other provider when the first stops answering, without retrying the dead host", () =>
        movesProviderOutage(lessonAi(), fake))

    it("exhausts the preferred model on every key before it serves the profile's fallback model", () =>
        exhaustsPreferredFirst(lessonAi(), fake))

    it("sends no learner identity field and names lanes by alias while redacting an echoed secret in a failure", () =>
        redactsFailureTelemetry(lessonAi(), fake))

    it("refuses grounding that cannot fit the smallest model window without a provider call", () =>
        refusesOversizedGrounding(lessonAi(), fake))
})
