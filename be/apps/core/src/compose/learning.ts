import type { DynamicModule } from "@nestjs/common"
import {
    AGENT_LAB_ERROR_KINDS,
    AGENT_LAB_MESSAGES,
    AgentLabModule,
    agentLabEntities,
    agentLabMigrations,
} from "@modules/domain/agent-lab"
import {
    ATTEMPT_ERROR_KINDS,
    ATTEMPT_MESSAGES,
    AiCoachClient,
    AttemptModule,
    attemptEntities,
    attemptMigrations,
} from "@modules/domain/attempt"
import { HUB_MESSAGES, HubModule } from "@modules/domain/hub"
import { IncidentModule } from "@modules/domain/incident"
import {
    LESSON_ERROR_KINDS,
    LESSON_MESSAGES,
    LessonModule,
    lessonEntities,
    lessonMigrations,
} from "@modules/domain/lesson"
import {
    NOTIFICATION_ERROR_KINDS,
    NOTIFICATION_MESSAGES,
    NotificationModule,
    notificationEntities,
    notificationMigrations,
} from "@modules/domain/notification"
import { PATH_ERROR_KINDS, PATH_MESSAGES, PathModule, pathEntities, pathMigrations } from "@modules/domain/path"
import {
    PRACTICE_ERROR_KINDS,
    PRACTICE_MESSAGES,
    PracticeModule,
    StreakServiceClient,
    practiceEntities,
    practiceMigrations,
} from "@modules/domain/practice"
import {
    REVIEW_ERROR_KINDS,
    REVIEW_MESSAGES,
    ReviewModule,
    reviewEntities,
    reviewMigrations,
} from "@modules/domain/review"
import {
    STREAK_ERROR_KINDS,
    STREAK_MESSAGES,
    StreakModule,
    streakEntities,
    streakMigrations,
} from "@modules/domain/streak"
import { JUDGE0_ERROR_KINDS, JUDGE0_MESSAGES, Judge0Module } from "@modules/integrations/judge0"
import type { DatabaseConnectionOptions } from "@modules/platform/database"
import type { ErrorKind } from "@modules/platform/errors"
import type { MessageBundle } from "@modules/platform/i18n"
import type { CoreOptions } from "../core.options"

/**
 * The learning area: the lessons and their attempts, practice over the judge, review, the agent lab, incidents, the streak, the
 * paths, the hub and the notifications. Without a declared Judge0 endpoint the judge still composes and refuses, so a run ends as
 * an internal error.
 */
export const learningModules = (options: CoreOptions): Array<DynamicModule> => [
    LessonModule.register({ isGlobal: true }),
    StreakModule.register({ isGlobal: true }),
    PathModule.register({ isGlobal: true }),
    HubModule.register({ isGlobal: true }),
    NotificationModule.register({ isGlobal: true }),
    PracticeModule.register({ isGlobal: true, ...options.practice, streak: StreakServiceClient }),
    ReviewModule.register({ isGlobal: true }),
    AttemptModule.register({
        isGlobal: true,
        dailyGradingLimit: options.attempt.dailyGradingLimit,
        coach: AiCoachClient,
    }),
    IncidentModule.register({ isGlobal: true }),
    AgentLabModule.register({ isGlobal: true, ...options.agentLab }),
    Judge0Module.register({ isGlobal: true, judge0: options.judge0 }),
]

/** The error kind tables of the learning area. */
export const learningAreaErrorKinds: ReadonlyArray<Readonly<Record<string, ErrorKind>>> = [
    LESSON_ERROR_KINDS,
    ATTEMPT_ERROR_KINDS,
    REVIEW_ERROR_KINDS,
    STREAK_ERROR_KINDS,
    PATH_ERROR_KINDS,
    NOTIFICATION_ERROR_KINDS,
    JUDGE0_ERROR_KINDS,
    PRACTICE_ERROR_KINDS,
    AGENT_LAB_ERROR_KINDS,
]

/** The message bundles of the learning area. */
export const learningAreaMessages: ReadonlyArray<MessageBundle> = [
    LESSON_MESSAGES,
    ATTEMPT_MESSAGES,
    REVIEW_MESSAGES,
    STREAK_MESSAGES,
    PATH_MESSAGES,
    HUB_MESSAGES,
    NOTIFICATION_MESSAGES,
    JUDGE0_MESSAGES,
    PRACTICE_MESSAGES,
    AGENT_LAB_MESSAGES,
]

/** The entities the learning area keeps in the primary database. */
export const learningAreaEntities: DatabaseConnectionOptions["entities"] = [
    ...lessonEntities,
    ...attemptEntities,
    ...practiceEntities,
    ...reviewEntities,
    ...agentLabEntities,
    ...streakEntities,
    ...pathEntities,
    ...notificationEntities,
]

/** The migrations of the learning area. */
export const learningAreaMigrations: DatabaseConnectionOptions["migrations"] = [
    ...lessonMigrations,
    ...attemptMigrations,
    ...practiceMigrations,
    ...reviewMigrations,
    ...agentLabMigrations,
    ...streakMigrations,
    ...pathMigrations,
    ...notificationMigrations,
]
