import { AiPoolModule, LESSON_AI } from "@modules/integrations/ai-pool"
import type { AiPoolOptions, LessonAi, LessonAiInput } from "@modules/integrations/ai-pool"
import { lessonAiPoolFakeProvider } from "../../world/test-apps.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * lesson-ai-pool: model fallback happens only as the lesson profile allows it. With `allowFallback` off the guarded
 * port stays on the preferred model across every key and never touches the fallback model, even when it would answer.
 */

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
            models: [
                { id: "deepseek/deepseek-v4.1-flash", contextWindow: 1_048_576 },
                { id: "deepseek/deepseek-v4-pro", contextWindow: 1_048_576 },
            ],
        },
    ],
    defaults: { maxAttempts: 4, timeoutMs: 5_000, deadlineMs: 15_000 },
    profiles: {
        lesson: {
            model: "deepseek/deepseek-v4.1-flash",
            fallbacks: ["deepseek/deepseek-v4-pro"],
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
    const fake = lessonAiPoolFakeProvider()
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

    it("keeps a failing preferred model on its own lanes and never calls the fallback model", async () => {
        fake.reset()
        fake.on({ model: "deepseek/deepseek-v4.1-flash" }, { status: 503 })
        fake.on({ model: "deepseek/deepseek-v4-pro" }, { text: "the fallback model must never answer" })

        await expect(lessonAi().complete(input())).rejects.toMatchObject({
            errorClass: "transient",
            status: 503,
        })

        expect(fake.calls.length).toBeGreaterThanOrEqual(2)
        expect(fake.calls.every((call) => call.model === "deepseek/deepseek-v4.1-flash")).toBe(true)
    })

    it("serves the preferred model under the same profile when it is healthy", async () => {
        fake.reset()
        fake.on({ model: "deepseek/deepseek-v4.1-flash" }, { text: "the preferred model answered" })

        const reply = await lessonAi().complete(input())

        expect(reply.choices[0]?.message.content).toBe("the preferred model answered")
        expect(reply.routing).toMatchObject({
            provider: "openrouter",
            model: "deepseek/deepseek-v4.1-flash",
            attempts: 1,
        })
        expect(fake.calls.map((call) => call.model)).toEqual(["deepseek/deepseek-v4.1-flash"])
    })
})
