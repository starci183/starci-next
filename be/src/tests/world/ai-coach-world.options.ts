import type { Type } from "@nestjs/common"
import { fakeIds } from "@starci/jest-preset"
import type { ModuleFactory } from "@starci/test-world"
import type { EntityManager } from "typeorm"
import { AiCoachClient, AttemptModule, AttemptService } from "@modules/domain/attempt"
import { EntitlementModule } from "@modules/domain/entitlement"
import { LessonModule } from "@modules/domain/lesson"
import { AiGatewayModule } from "@modules/integrations/ai-gateway"
import { persistDemoLesson } from "../fixtures/builders/lesson.builder"
import type { OpenrouterFakeClient } from "./fakes/openrouter/openrouter.client"

/** The coach limit per learner per day of the AI coach worlds: small, so a spec reaches it. */
export const AI_COACH_WORLD_DAILY_LIMIT = 2

/**
 * The modules of the AI coach worlds: the real attempt capability graded by the real `AiCoachClient` through the real gateway and
 * `@starci/ai-router` pool, whose only double is OpenRouter at the network edge (the world's openrouter fake). Retries wait 1 ms
 * and no breaker opens, so an outage ends fast and one case does not poison the next.
 */
export const aiCoachModules: ReadonlyArray<ModuleFactory> = [
    (w) =>
        AiGatewayModule.register({
            isGlobal: true,
            gateway: {
                maxOutputTokens: 512,
                pool: {
                    providers: [
                        {
                            id: "openrouter",
                            kind: "openrouter",
                            baseUrl: w.fake.openrouter?.url ?? "",
                            keys: [{ alias: "world-key", resolve: () => "world-placeholder-key" }],
                            models: [{ id: "world/model-a" }],
                        },
                    ],
                    profiles: {
                        coach: { model: "world/model-a", maxAttempts: 2, deadlineMs: 10_000 },
                        interview: { model: "world/model-a", maxAttempts: 2, deadlineMs: 10_000 },
                    },
                    resilience: {
                        backoff: { baseMs: 1, factor: 1, maxMs: 1 },
                        keyBreaker: { failureThreshold: 1000 },
                        providerBreaker: { failureThreshold: 1000 },
                        authDisableMs: 1,
                    },
                },
            },
        }),
    () => ({
        ...AttemptModule.register({ coach: AiCoachClient, dailyGradingLimit: AI_COACH_WORLD_DAILY_LIMIT }),
        imports: [{ ...LessonModule.register({}), imports: [EntitlementModule.register({})] }],
    }),
]

/** The databases of a booted AI coach world. */
export interface AiCoachWorldDatabases {
    /** The primary database. */
    readonly primary?: EntityManager | undefined
}

/** The fakes of a booted AI coach world. */
export interface AiCoachWorldFakes {
    /** The OpenRouter fake. */
    readonly openrouter?: OpenrouterFakeClient | undefined
}

/** What a booted AI coach world gives a spec: the providers it resolves, its fakes and the primary database. */
export interface AiCoachWorldHandle {
    /** Answers the provider registered under the class. */
    resolve<TProvider>(token: Type<TProvider>): TProvider
    /** The databases of the world. */
    readonly db: AiCoachWorldDatabases
    /** The fakes of the world. */
    readonly fake: AiCoachWorldFakes
}

/** What a spec of the AI coach worlds drives. */
export interface AiCoachWorld {
    /** The attempt service graded by the AI coach. */
    attempts(): AttemptService
    /** The OpenRouter fake behind the pool. */
    openrouter(): OpenrouterFakeClient | undefined
    /** The primary database of the world. */
    db(): EntityManager | undefined
    /** A learner nobody used before in the file. */
    newLearner(): string
}

/** Wraps the booted world: the demo lesson is stored once and the OpenRouter fake forgets its script before every case. Call it inside `describe`. */
export const useAiCoachWorld = (world: AiCoachWorldHandle): AiCoachWorld => {
    const ids = fakeIds()
    beforeAll(async () => {
        await persistDemoLesson(world.db.primary)
    })
    beforeEach(async () => {
        await world.fake.openrouter?.reset()
    })
    return {
        attempts: () => world.resolve(AttemptService),
        openrouter: () => world.fake.openrouter,
        db: (): EntityManager | undefined => world.db.primary,
        newLearner: () => ids.next(),
    }
}
