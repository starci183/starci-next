import { AiRouterService } from "@starci/ai-router"
import type { PoolConfig } from "@starci/ai-router"
import { createFakeProvider } from "@starci/ai-router/testing"
import { AiPoolModule, LESSON_AI } from "@modules/integrations/ai-pool"
import type { LessonAi, LessonAiInput } from "@modules/integrations/ai-pool"
import { useTestWorld } from "../../../world/use-test-world"

/**
 * lessons/ai-pool: the provider breaker of the pool's resilience, observed through the router's real health snapshot.
 * Consecutive transient failures open it, the cooldown admits exactly one probe half-open, a failed probe reopens it
 * and a healthy probe closes it again.
 */

const pool: PoolConfig<"lesson"> = {
    providers: [
        {
            id: "deepseek",
            baseUrl: "https://api.deepseek.com",
            maxConcurrency: 8,
            keys: [
                { alias: "lesson-primary", resolve: () => "test-primary-key", maxConcurrency: 4 },
                { alias: "lesson-fallback-1", resolve: () => "test-fallback-key", maxConcurrency: 4 },
            ],
            models: [{ id: "deepseek-flash", aliases: ["deepseek-4.1-flash"], contextWindow: 1_000_000 }],
        },
    ],
    defaults: { maxAttempts: 2, timeoutMs: 1_000, deadlineMs: 4_000 },
    profiles: {
        lesson: {
            model: "deepseek-4.1-flash",
            allowFallback: true,
            maxAttempts: 2,
            timeoutMs: 1_000,
            deadlineMs: 4_000,
        },
    },
    resilience: {
        keyBreaker: { failureThreshold: 50, cooldownMs: 200, maxCooldownMs: 400 },
        providerBreaker: { failureThreshold: 2, cooldownMs: 200, maxCooldownMs: 400 },
        backoff: { baseMs: 5, factor: 2, maxMs: 10 },
    },
    telemetry: { includeContent: false },
}

const input = (): LessonAiInput => ({
    messages: [{ role: "user", content: "Explain the lesson section." }],
    grounding: "The section explains REST verb semantics.",
})

describe("lesson AI pool: provider breaker open and half-open (integration)", () => {
    const fake = createFakeProvider()
    const world = useTestWorld({
        modules: [
            () =>
                AiPoolModule.register({
                    isGlobal: true,
                    pool: { ...pool, fetch: fake.fetch, random: () => 0.5 },
                    limits: { maxOutputTokens: 1024, reservedPromptTokens: 2048 },
                }),
        ],
    })

    const lessonAi = (): LessonAi => world.resolve<LessonAi>(LESSON_AI)
    const router = (): AiRouterService<"lesson"> => world.resolve<AiRouterService<"lesson">>(AiRouterService)

    const providerBreaker = async (): Promise<string | undefined> => (await router().health()).providers[0]?.breaker

    const halfOpen = (): Promise<string> =>
        world.waitFor("the provider breaker admits a half-open probe", async () =>
            (await providerBreaker()) === "half-open" ? "half-open" : null,
        )

    it("opens on consecutive transient failures, reopens on a failed probe and closes on a healthy one", async () => {
        fake.reset()
        fake.on({}, { status: 503 })

        await expect(lessonAi().complete(input())).rejects.toMatchObject({ errorClass: "transient" })
        expect(await providerBreaker()).toBe("open")

        await halfOpen()
        await expect(lessonAi().complete(input())).rejects.toMatchObject({ errorClass: "transient" })
        expect(await providerBreaker()).toBe("open")

        await halfOpen()
        fake.on({}, { text: "the provider recovered" })
        const reply = await lessonAi().complete(input())

        expect(reply.choices[0]?.message.content).toBe("the provider recovered")
        expect(await providerBreaker()).toBe("closed")
        const health = await router().health()
        expect(health.providers[0]?.failures).toBe(0)
        expect(fake.calls[fake.calls.length - 1]?.key).toMatch(/^test-(primary|fallback)-key$/)
    })
})
