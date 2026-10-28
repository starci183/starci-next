import { AiPoolModule, LESSON_AI } from "@modules/integrations/ai-pool"
import type { AiPoolOptions, LessonAi, LessonAiInput } from "@modules/integrations/ai-pool"
import { lessonAiBreakerState, lessonAiPoolFakeProvider, lessonAiPoolHealthStore } from "../../world/test-apps.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * lesson-ai-pool: the provider breaker of the pool's resilience, observed through the records the pool writes into
 * the spec's own `store` seam. Consecutive transient failures open it, a cooldown expired by writing `openUntil`
 * admits exactly one probe half-open, a failed probe reopens it and a healthy probe closes it again. The cooldown
 * is long and the spec expires it through the store itself, so no assertion ever races the wall clock.
 */

const STORE_NAMESPACE = "lesson-breaker"
const PROVIDER_RECORD = `${STORE_NAMESPACE}:provider:openrouter`
const COOLDOWN_MS = 3_600_000

const pool: AiPoolOptions["pool"] = {
    providers: [
        {
            id: "openrouter",
            baseUrl: "https://openrouter.ai/api/v1",
            maxConcurrency: 8,
            keys: [
                { alias: "openrouter-primary", resolve: () => "test-primary-key", maxConcurrency: 4 },
                { alias: "openrouter-secondary", resolve: () => "test-fallback-key", maxConcurrency: 4 },
            ],
            models: [{ id: "deepseek/deepseek-v4.1-flash", contextWindow: 1_048_576 }],
        },
    ],
    defaults: { maxAttempts: 2, timeoutMs: 1_000, deadlineMs: 4_000 },
    profiles: {
        lesson: {
            model: "deepseek/deepseek-v4.1-flash",
            allowFallback: true,
            maxAttempts: 2,
            timeoutMs: 1_000,
            deadlineMs: 4_000,
        },
    },
    resilience: {
        keyBreaker: { failureThreshold: 50 },
        providerBreaker: { failureThreshold: 2, cooldownMs: COOLDOWN_MS, maxCooldownMs: COOLDOWN_MS * 2 },
        backoff: { baseMs: 5, factor: 2, maxMs: 10 },
    },
    telemetry: { includeContent: false },
    storeNamespace: STORE_NAMESPACE,
}

const input = (): LessonAiInput => ({
    messages: [{ role: "user", content: "Explain the lesson section." }],
    grounding: "The section explains REST verb semantics.",
})

describe("lesson AI pool: provider breaker open and half-open (integration)", () => {
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

    const providerBreaker = async (): Promise<"closed" | "open" | "half-open"> =>
        lessonAiBreakerState(await store.get(PROVIDER_RECORD))

    /** Expires an open provider breaker's cooldown in the store: the `openUntil` flip the router computes from time. */
    const expireProviderCooldown = async (): Promise<void> => {
        const record = await store.get(PROVIDER_RECORD)
        expect(record?.breaker).toBe("open")
        if (record === undefined) return
        await store.set(PROVIDER_RECORD, { ...record, openUntil: 0 })
    }

    it("opens on consecutive transient failures, reopens on a failed probe and closes on a healthy one", async () => {
        fake.reset()
        fake.on({}, { status: 503 })

        await expect(lessonAi().complete(input())).rejects.toMatchObject({ errorClass: "transient" })
        expect(await providerBreaker()).toBe("open")

        await expireProviderCooldown()
        expect(await providerBreaker()).toBe("half-open")
        await expect(lessonAi().complete(input())).rejects.toMatchObject({ errorClass: "transient" })
        expect(await providerBreaker()).toBe("open")

        await expireProviderCooldown()
        expect(await providerBreaker()).toBe("half-open")
        fake.on({}, { text: "the provider recovered" })
        const reply = await lessonAi().complete(input())

        expect(reply.choices[0]?.message.content).toBe("the provider recovered")
        expect(await providerBreaker()).toBe("closed")
        expect((await store.get(PROVIDER_RECORD))?.failures).toBe(0)
        expect(fake.calls[fake.calls.length - 1]?.key).toMatch(/^test-(primary|fallback)-key$/)
    })
})
