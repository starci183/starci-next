import { Module } from "@nestjs/common"
import type { DynamicModule } from "@nestjs/common"
import type { ModuleRegistration, SandboxSpec } from "@starci/test-world"
import { AiPoolModule, LESSON_AI } from "@modules/integrations/ai-pool"
import type { AiPoolOptions, LessonAi, LessonAiInput } from "@modules/integrations/ai-pool"
import { LoggingModule } from "@modules/platform/logging"
import { appliedMigrations, PRIMARY_APPLIED_MIGRATIONS } from "../../fixtures/persistence/migrations.sql"
import { useSandbox, useTestWorld } from "../../world/use-test-world"
import { lessonAiPoolHealthStore } from "../../world/test-apps.options"
import type { LessonAiPoolHealthStore } from "../../world/test-apps.options"

/**
 * integration.lessons.ai-router, opt-in: the real AiPoolModule, the pool declared by `ai-pool.data.json` bound by name
 * to the one custody key OPENROUTER_API_KEY of sealed member `ai` and the real OpenRouter endpoint, exercised only
 * when `ai-router-live verify` runs this suite with the key declared. The composed core app proves the options reach
 * the module the way `core.env.ts` gives them; the live calls themselves boot through the sandbox of the test world,
 * which reads the named key itself — no key value is read or printed here, only routing metadata (provider, key
 * alias, model id, attempt count, latency). A run without the key is red naming it, never a fake-provider pass.
 */

const CUSTODY_KEYS: ReadonlyArray<string> = ["OPENROUTER_API_KEY"]
const PRIMARY_MODEL = "deepseek/deepseek-v4.1-flash"
const FALLBACK_MODEL = "deepseek/deepseek-v4-pro"
const STORE_NAMESPACE = "lesson-ai-router-live"
const PRIMARY_LANE = `${STORE_NAMESPACE}:lane:openrouter/openrouter-primary/${PRIMARY_MODEL}`
/** Epoch milliseconds of 2100-01-01: the lane refusal the spec seeds holds for the whole call, whatever the host clock. */
const REFUSED_UNTIL = 4_102_444_800_000

/**
 * The pool `ai-pool.data.json` declares, rebuilt as typed options with the named custody key bound through the
 * sandbox's `values`, the way `parseAiPoolConfig` binds it for `core.env.ts`; the refused pool adds the router's
 * documented `store` adapter so the spec holds the lane records it injects.
 */
const livePool = (values: Readonly<Record<string, string>>, store?: LessonAiPoolHealthStore): AiPoolOptions => ({
    pool: {
        providers: [
            {
                id: "openrouter",
                baseUrl: "https://openrouter.ai/api/v1",
                maxConcurrency: 8,
                keys: [
                    {
                        alias: "openrouter-primary",
                        resolve: () => values["OPENROUTER_API_KEY"],
                        maxConcurrency: 8,
                    },
                ],
                models: [
                    { id: PRIMARY_MODEL, contextWindow: 1_048_576 },
                    { id: FALLBACK_MODEL, contextWindow: 1_048_576 },
                ],
            },
        ],
        defaults: { maxAttempts: 4, timeoutMs: 30_000, deadlineMs: 60_000 },
        profiles: {
            lesson: {
                model: PRIMARY_MODEL,
                fallbacks: [FALLBACK_MODEL],
                allowFallback: true,
                maxAttempts: 4,
                timeoutMs: 30_000,
                deadlineMs: 60_000,
            },
        },
        resilience: { keyBreaker: { failureThreshold: 3 }, providerBreaker: { failureThreshold: 8 } },
        telemetry: { includeContent: false },
        ...(store === undefined ? {} : { store, storeNamespace: STORE_NAMESPACE }),
    },
    limits: { maxOutputTokens: 1024, reservedPromptTokens: 2048 },
})

@Module({})
class LivePoolRoot {}

/** The module the sandbox composes: the platform logger plus the real pool module registered as the app root does. */
const liveModule =
    (options: (values: Readonly<Record<string, string>>) => AiPoolOptions): SandboxSpec<LessonAi>["module"] =>
    (values: Readonly<Record<string, string>>, registration: ModuleRegistration): DynamicModule => ({
        module: LivePoolRoot,
        ...registration,
        imports: [
            LoggingModule.register({ ...registration }),
            AiPoolModule.register({ ...registration, ...options(values) }),
        ],
    })

const healthyPool = (values: Readonly<Record<string, string>>): AiPoolOptions => livePool(values)

/**
 * The refused pool: the router's documented `store` adapter carries the lane record a rate-limited primary leaves
 * (`cooldownUntil`), seeded before the pool takes its first call — the failure injection of this proof, so the
 * primary model has no usable lane and the profile's ordered fallback has to serve.
 */
const refusedPool = (values: Readonly<Record<string, string>>): AiPoolOptions => {
    const store = lessonAiPoolHealthStore()
    void store.set(PRIMARY_LANE, {
        breaker: "closed",
        failures: 0,
        openUntil: 0,
        cooldownMs: 0,
        disabledUntil: 0,
        disabledReason: null,
        remainingRequests: null,
        requestsResetAt: 0,
        remainingTokens: null,
        tokensResetAt: 0,
        cooldownUntil: REFUSED_UNTIL,
    })
    return livePool(values, store)
}

const healthy = useSandbox<LessonAi>({
    provider: "openrouter",
    keys: CUSTODY_KEYS,
    module: liveModule(healthyPool),
    client: LESSON_AI,
})

const refused = useSandbox<LessonAi>({
    provider: "openrouter",
    keys: CUSTODY_KEYS,
    module: liveModule(refusedPool),
    client: LESSON_AI,
})

jest.setTimeout(120_000)

const input = (): LessonAiInput => ({
    messages: [{ role: "user", content: "In one sentence, what does a REST GET verb promise?" }],
    grounding: "A REST GET is safe and idempotent: it reads a representation and never changes the resource.",
})

describe("lesson AI pool: the composed app receives the pool's typed options (e2e)", () => {
    const world = useTestWorld({ apps: ["core"] })

    it("serves the app whose pool is composed from named custody references over the migrated store", async () => {
        const live = await world.apps.core.api.get("/health/live")
        const ready = await world.apps.core.api.get("/health/ready")
        const applied = await appliedMigrations(world.db.primary, PRIMARY_APPLIED_MIGRATIONS)

        expect(live.status).toBe(200)
        expect(ready.status).toBe(200)
        expect(ready.body).toEqual({ ok: true })
        expect(applied.length).toBeGreaterThan(0)
        expect(JSON.stringify(live.body)).not.toContain("Bearer")
        expect(JSON.stringify(ready.body)).not.toContain("Bearer")
    })
})

healthy.describe("lesson AI pool against the live provider, healthy custody (opt-in)", () => {
    it("answers a grounded completion through the preferred model and the one custody key", async () => {
        const reply = await healthy.client().complete(input())

        expect((reply.choices[0]?.message.content ?? "").length).toBeGreaterThan(0)
        expect(reply.routing).toMatchObject({
            provider: "openrouter",
            key: "openrouter-primary",
            model: PRIMARY_MODEL,
        })
        expect(reply.routing.attempts).toBeGreaterThanOrEqual(1)
        expect(reply.routing.latencyMs).toBeGreaterThan(0)
        expect(JSON.stringify(reply.routing)).not.toContain("Bearer")
        expect(reply.usage?.total_tokens).toBeGreaterThan(0)
    })
})

refused.describe("lesson AI pool against the live provider, refused primary model (opt-in)", () => {
    it("serves the profile's fallback model over the same key while the primary model's lane is refused", async () => {
        const reply = await refused.client().complete(input())

        expect((reply.choices[0]?.message.content ?? "").length).toBeGreaterThan(0)
        expect(reply.routing).toMatchObject({
            provider: "openrouter",
            key: "openrouter-primary",
            model: FALLBACK_MODEL,
        })
        expect(reply.routing.attempts).toBeGreaterThanOrEqual(1)
        expect(JSON.stringify(reply.routing)).not.toContain("Bearer")
    })
})
