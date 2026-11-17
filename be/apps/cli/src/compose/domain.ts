import type { DynamicModule, Type } from "@nestjs/common"
import { AttemptModule } from "@modules/domain/attempt"
import { CareerModule } from "@modules/domain/career"
import { ContentModule } from "@modules/domain/content"
import { EntitlementModule } from "@modules/domain/entitlement"
import { AiInterviewClient, InterviewModule } from "@modules/domain/interview"
import { HarnessModule } from "@modules/domain/harness"
import { LessonModule } from "@modules/domain/lesson"
import { McpIndexModule } from "@modules/domain/mcp"
import { NotificationModule } from "@modules/domain/notification"
import { PracticeModule } from "@modules/domain/practice"
import { ProjectModule } from "@modules/domain/project"
import { ProbeModule } from "@modules/integrations/probe"
import { ReviewModule } from "@modules/domain/review"
import { StreakModule } from "@modules/domain/streak"
import type { CliAppOptions } from "../cli.options"

/** The domain capabilities the command line drives: the lesson and deck imports and the entitlement and streak they depend on. */
export const domainModules = (options: CliAppOptions): Array<Type<unknown> | DynamicModule> => [
    // The development grant of `cli entitlement dev-grant` is enabled only by ENTITLEMENT_DEV_GRANT.
    EntitlementModule.register({ isGlobal: true, devGrant: options.entitlement.devGrant }),
    LessonModule.register({ isGlobal: true }),
    PracticeModule.register({ isGlobal: true }),
    // The harness CI service verifies a run through the project capability's attestation port (defaults: no attestation, no relay).
    ProjectModule.register({ isGlobal: true }),
    ProbeModule.register({ isGlobal: true }),
    HarnessModule.register({ isGlobal: true }),
    StreakModule.register({ isGlobal: true }),
    InterviewModule.register({ isGlobal: true, coach: AiInterviewClient }),
    NotificationModule.register({ isGlobal: true }),
    ReviewModule.register({ isGlobal: true }),
    // The experience engine for `cli career`: its essentials producer reads the attempts, and the development seed is enabled only by CAREER_DEV_SEED.
    AttemptModule.register({ isGlobal: true }),
    CareerModule.register({ isGlobal: true, devSeed: options.career.devSeed }),
    // The gitmount for `cli content sync`: it pulls the content repositories and runs the importers above at the pulled version.
    ContentModule.register({ isGlobal: true, ...options.content }),
    // The semantic index for `cli mcp reindex`: the embedder, the pgvector store and the harness content, without the relay or the lessons.
    McpIndexModule.register({
        isGlobal: true,
        embed: options.mcp.embed,
        harnessDir: options.mcp.harnessDir,
        qdrant: options.mcp.qdrant,
    }),
]
