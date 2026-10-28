import { AiRouterService } from "@starci/ai-router"
import type { HealthRecord, PoolConfig, StateStore } from "@starci/ai-router"
import { createFakeProvider } from "@starci/ai-router/testing"
import { AiPoolModule, LESSON_AI } from "@modules/integrations/ai-pool"
import type { LessonAi, LessonAiInput } from "@modules/integrations/ai-pool"
import { useTestWorld } from "../../../world/use-test-world"

/**
 * lessons/ai-pool: the provider breaker of the pool's resilience, observed through the router's real health snapshot.
 * Consecutive transient failures open it, a cooldown expired through the pool's documented `store` seam admits exactly
 * one probe half-open, a failed probe reopens it and a healthy probe closes it again. The cooldown is long and the
 * spec expires it by writing `openUntil` itself, so no assertion ever races the wall clock.
 */

const STORE_NAMESPACE = "lesson-breaker"
const PROVIDER_RECORD = `${STORE_NAMESPACE}:provider:deepseek`
const COOLDOWN_MS = 3_600_000

/** The spec's own `StateStore`: the documented seam the pool writes breaker, disabled-key and headroom records into. */
class SpecStateStore implements StateStore {
    private readonly records = new Map<string, HealthRecord>()
    private readonly leases = new Set<string>()

    get(key: string): HealthRecord | undefined {
        return this.records.get(key)
    }
    set(key: string, record: HealthRecord): void {
        this.records.set(key, record)
    }
    delete(key: string): void {
        this.records.delete(key)
    }
    keys(prefix: string): ReadonlyArray<string> {
        return [...this.records.keys()].filter((key) => key.startsWith(prefix))
    }
    lease(key: string): boolean {
        if (this.leases.has(key)) return false
        this.leases.add(key)
        return true
    }
    release(key: string): void {
        this.leases.delete(key)
    }
}

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
    const fake = createFakeProvider()
    const store = new SpecStateStore()
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
    const router = (): AiRouterService<"lesson"> => world.resolve<AiRouterService<"lesson">>(AiRouterService)

    const providerBreaker = async (): Promise<string | undefined> => (await router().health()).providers[0]?.breaker

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
        const health = await router().health()
        expect(health.providers[0]?.failures).toBe(0)
        expect(fake.calls[fake.calls.length - 1]?.key).toMatch(/^test-(primary|fallback)-key$/)
    })
})
