import type { PoolConfig } from "@starci/ai-router"
import { createFakeProvider } from "@starci/ai-router/testing"
import { AiPoolModule, LESSON_AI } from "@modules/integrations/ai-pool"
import type { LessonAi, LessonAiInput } from "@modules/integrations/ai-pool"
import { useTestWorld } from "../../../world/use-test-world"

/**
 * lessons/ai-pool: model fallback happens only as the lesson profile allows it. With `allowFallback` off the guarded
 * port stays on the preferred model across every key and never touches the fallback model, even when it would answer.
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
            models: [
                { id: "deepseek-flash", aliases: ["deepseek-4.1-flash"], contextWindow: 1_000_000 },
                { id: "deepseek-v4-pro", contextWindow: 1_000_000 },
            ],
        },
    ],
    defaults: { maxAttempts: 4, timeoutMs: 5_000, deadlineMs: 15_000 },
    profiles: {
        lesson: {
            model: "deepseek-4.1-flash",
            fallbacks: ["deepseek-v4-pro"],
            allowFallback: false,
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

const input = (): LessonAiInput => ({
    messages: [{ role: "user", content: "Explain the lesson section." }],
    grounding: "The section explains REST verb semantics.",
})

describe("lesson AI pool: fallback only as the profile allows (integration)", () => {
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

    it("keeps a failing preferred model on its own lanes and never calls the fallback model", async () => {
        fake.reset()
        fake.on({ model: "deepseek-flash" }, { status: 503 })
        fake.on({ model: "deepseek-v4-pro" }, { text: "the fallback model must never answer" })

        await expect(lessonAi().complete(input())).rejects.toMatchObject({
            errorClass: "transient",
            status: 503,
        })

        expect(fake.calls.length).toBeGreaterThanOrEqual(2)
        expect(fake.calls.every((call) => call.model === "deepseek-flash")).toBe(true)
    })

    it("serves the preferred model under the same profile when it is healthy", async () => {
        fake.reset()
        fake.on({ model: "deepseek-flash" }, { text: "the preferred model answered" })

        const reply = await lessonAi().complete(input())

        expect(reply.choices[0]?.message.content).toBe("the preferred model answered")
        expect(reply.routing).toMatchObject({ provider: "deepseek", model: "deepseek-flash", attempts: 1 })
        expect(fake.calls.map((call) => call.model)).toEqual(["deepseek-flash"])
    })
})
