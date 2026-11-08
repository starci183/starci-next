import type { Type } from "@nestjs/common"
import type { ModuleFactory } from "@starci/test-world"
import type { EntityManager } from "typeorm"
import { AttemptModule } from "@modules/domain/attempt"
import {
    CareerModule,
    ExperienceReadService,
    ExperienceReviewService,
    ExperienceService,
    ExperienceSeedService,
    ReviewerService,
} from "@modules/domain/career"
import { EntitlementModule } from "@modules/domain/entitlement"
import { LessonModule } from "@modules/domain/lesson"

/** The modules of a career world, with or without the development seed enabled. */
const careerModulesOf = (devSeed: boolean): ReadonlyArray<ModuleFactory> => [
    () => ({
        ...CareerModule.register({ devSeed }),
        imports: [
            EntitlementModule.register({ isGlobal: true }),
            LessonModule.register({ isGlobal: true }),
            AttemptModule.register({ isGlobal: true }),
        ],
    }),
]

/** The modules of the career worlds: the engine over the real entitlement, lesson and attempt capabilities. */
export const careerModules: ReadonlyArray<ModuleFactory> = careerModulesOf(false)

/** The modules of the development-seed world: the same engine with the seed enabled, as the development stack runs it. */
export const careerSeedModules: ReadonlyArray<ModuleFactory> = careerModulesOf(true)

/** The databases of a booted career world. */
export interface CareerWorldDatabases {
    /** The primary database. */
    readonly primary?: EntityManager | undefined
}

/** What a booted career world gives a spec. */
export interface CareerWorldHandle {
    /** Answers the provider registered under the class. */
    resolve<TProvider>(token: Type<TProvider>): TProvider
    /** The databases of the world. */
    readonly db: CareerWorldDatabases
}

/** The services of the experience engine a spec drives, over the real database. */
export interface CareerWorld {
    /** The learner side. */
    experiences(): ExperienceService
    /** The signer side. */
    reviews(): ExperienceReviewService
    /** The reads. */
    reads(): ExperienceReadService
    /** The appointments. */
    reviewers(): ReviewerService
    /** The development seed. */
    seeds(): ExperienceSeedService
    /** The primary database. */
    db(): EntityManager | undefined
}

/** Wraps the world a spec booted with `useTestWorld({ modules: careerModules })`. Call it inside `describe`. */
export const useCareerWorld = (world: CareerWorldHandle): CareerWorld => ({
    experiences: () => world.resolve(ExperienceService),
    reviews: () => world.resolve(ExperienceReviewService),
    reads: () => world.resolve(ExperienceReadService),
    reviewers: () => world.resolve(ReviewerService),
    seeds: () => world.resolve(ExperienceSeedService),
    db: () => world.db.primary,
})
