import type { Type } from "@nestjs/common"
import type { ModuleFactory } from "@starci/test-world"
import { demoTopicCatalogOf } from "../fixtures/builders/lesson.builder"
import { EntitlementModule } from "@modules/domain/entitlement"
import { LessonContentService, LessonModule } from "@modules/domain/lesson"

/** The modules of the lesson worlds: the lesson capability over the entitlement it reads for the Premium gate. */
export const lessonModules: ReadonlyArray<ModuleFactory> = [
    () => ({ ...LessonModule.register({ topics: demoTopicCatalogOf() }), imports: [EntitlementModule.register({})] }),
]

/** What a booted world resolves providers with. */
export interface LessonWorldResolver {
    /** Answers the provider registered under the class. */
    resolve<TProvider>(token: Type<TProvider>): TProvider
}

/** The server-side content port of a booted world: the one the attempts and grading side reads whole activities through. */
export const contentPortOf = (world: LessonWorldResolver): LessonContentService => world.resolve(LessonContentService)
