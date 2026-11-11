import type { DynamicModule, Type } from "@nestjs/common"
import { AttemptModule } from "@modules/domain/attempt"
import { CareerModule } from "@modules/domain/career"
import { ContentModule } from "@modules/domain/content"
import { EntitlementModule } from "@modules/domain/entitlement"
import { AiInterviewClient, InterviewModule } from "@modules/domain/interview"
import { LessonModule } from "@modules/domain/lesson"
import { NotificationModule } from "@modules/domain/notification"
import { PracticeModule } from "@modules/domain/practice"
import { ReviewModule } from "@modules/domain/review"
import { StreakModule } from "@modules/domain/streak"
import type { CliAppOptions } from "../cli.options"

/** The domain capabilities the command line drives: the lesson and deck imports and the entitlement and streak they depend on. */
export const domainModules = (options: CliAppOptions): Array<Type<unknown> | DynamicModule> => [
    // The development grant of `cli entitlement dev-grant` is enabled only by ENTITLEMENT_DEV_GRANT.
    EntitlementModule.register({ isGlobal: true, devGrant: options.entitlement.devGrant }),
    LessonModule.register({ isGlobal: true }),
    PracticeModule.register({ isGlobal: true }),
    StreakModule.register({ isGlobal: true }),
    InterviewModule.register({ isGlobal: true, coach: AiInterviewClient }),
    NotificationModule.register({ isGlobal: true }),
    ReviewModule.register({ isGlobal: true }),
    // The experience engine for `cli career`: its essentials producer reads the attempts, and the development seed is enabled only by CAREER_DEV_SEED.
    AttemptModule.register({ isGlobal: true }),
    CareerModule.register({ isGlobal: true, devSeed: options.career.devSeed }),
    // The gitmount for `cli content sync`: it pulls the content repositories and runs the importers above at the pulled version.
    ContentModule.register({ isGlobal: true, ...options.content }),
]
