import { Injectable, type Type } from "@nestjs/common"
import { fakeIds } from "@starci/jest-preset"
import type { ModuleFactory } from "@starci/test-world"
import type { EntityManager } from "typeorm"
import {
    AttemptError,
    AttemptErrorCode,
    AttemptModule,
    AttemptReadService,
    AttemptService,
    type AttemptAnswer,
    type CoachGrade,
    type CoachGradeRequest,
} from "@modules/domain/attempt"
import { EntitlementModule } from "@modules/domain/entitlement"
import { LessonModule } from "@modules/domain/lesson"
import { persistDemoLesson, persistPremium } from "../fixtures/builders/lesson.builder"
import { STORED_ATTEMPTS } from "../fixtures/persistence/attempt.sql"

/** How the scripted coach answers one request. */
type CoachScript = (request: CoachGradeRequest) => Promise<CoachGrade>

/** The longest prefix of the answer that the default grade quotes. */
const QUOTE_LENGTH = 20

/** Grades every criterion at level 2 and quotes the start of the answer, which the answer holds by construction. */
const praise: CoachScript = (request) =>
    Promise.resolve({
        criteria: request.rubric.map((criterion) => ({
            criterionId: criterion.id,
            level: 2,
            evidenceQuote: request.answerText.slice(0, QUOTE_LENGTH),
        })),
    })

/** Fails every request the way a provider that does not answer does. */
const breakdown: CoachScript = () => Promise.reject(new AttemptError({ code: AttemptErrorCode.CoachUnavailable }))

@Injectable()
/** The deterministic fake of the AI teacher: it records every request it receives and answers as the case scripts it. */
export class ScriptedCoachClient {
    /** Every request the coach received, in order. */
    readonly requests: Array<CoachGradeRequest> = []

    private script: CoachScript = praise

    /** Records the request and answers it as scripted. */
    grade(request: CoachGradeRequest): Promise<CoachGrade> {
        this.requests.push(request)
        return this.script(request)
    }

    /** Answers the next requests with the script until the next call; the default praises every criterion. */
    answerWith(script: CoachScript): void {
        this.script = script
    }

    /** Fails the next requests as a provider that does not answer. */
    breakDown(): void {
        this.script = breakdown
    }

    /** Forgets the recorded requests and goes back to praising every criterion. */
    reset(): void {
        this.requests.length = 0
        this.script = praise
    }
}

/** The modules of the attempt worlds: the lesson content and entitlement the attempts read, then the attempts over the scripted coach. */
export const attemptModules: ReadonlyArray<ModuleFactory> = [
    () => ({
        ...AttemptModule.register({ coach: ScriptedCoachClient }),
        imports: [{ ...LessonModule.register({}), imports: [EntitlementModule.register({})] }],
    }),
]

/** What a booted world resolves providers with. */
export interface AttemptWorldResolver {
    /** Answers the provider registered under the class. */
    resolve<TProvider>(token: Type<TProvider>): TProvider
}

/** The attempt service of a booted world. */
export const attemptsOf = (world: AttemptWorldResolver): AttemptService => world.resolve(AttemptService)

/** The attempt read service of a booted world. */
export const attemptReadsOf = (world: AttemptWorldResolver): AttemptReadService => world.resolve(AttemptReadService)

/** The scripted coach of a booted world: the same instance the attempt service grades through. */
export const coachOf = (world: AttemptWorldResolver): ScriptedCoachClient => world.resolve(ScriptedCoachClient)

/** One stored attempt as a world spec reads it back. */
export interface StoredAttemptRow {
    /** The attempt id. */
    readonly attempt_id: string
    /** The activity. */
    readonly activity_id: string
    /** The revision. */
    readonly revision: number
    /** The kind. */
    readonly kind: string
    /** The phase. */
    readonly phase: string
    /** The status. */
    readonly status: string
    /** The failure code, or null. */
    readonly failure_code: string | null
    /** The normalized answer as stored. */
    readonly answer: AttemptAnswer
}

/** Reads the attempts of a learner as the database holds them. */
export const storedAttemptsOf = async (
    manager: EntityManager | undefined,
    learnerId: string,
): Promise<Array<StoredAttemptRow>> =>
    (await manager?.query<Array<StoredAttemptRow>>(STORED_ATTEMPTS, [learnerId])) ?? []

/** What a spec of the attempt service drives: the real capability over the real database, the scripted coach at the edge. */
export interface AttemptWorld {
    /** The attempt service. */
    attempts(): AttemptService
    /** The attempt read service. */
    reads(): AttemptReadService
    /** The scripted coach. */
    coach(): ScriptedCoachClient
    /** The primary database of the world. */
    db(): EntityManager | undefined
    /** A learner nobody used before in the file, without Premium. */
    newLearner(): string
    /** A learner nobody used before in the file, with Premium. */
    premiumLearner(): Promise<string>
}

/** The databases of a booted attempt world. */
export interface AttemptWorldDatabases {
    /** The primary database. */
    readonly primary?: EntityManager | undefined
}

/** What a booted attempt world gives a spec: the providers it resolves and the primary database. */
export interface AttemptWorldHandle extends AttemptWorldResolver {
    /** The databases of the world. */
    readonly db: AttemptWorldDatabases
}

/**
 * Wraps the world a spec booted with `useTestWorld({ modules: attemptModules })`: the demo lesson is stored once, the coach is
 * reset before every case, and learners are fresh ids so no case sees the rows of another. Call it inside `describe`.
 */
export const useAttemptWorld = (world: AttemptWorldHandle): AttemptWorld => {
    const ids = fakeIds()
    beforeAll(async () => {
        await persistDemoLesson(world.db.primary)
    })
    beforeEach(() => {
        coachOf(world).reset()
    })
    return {
        attempts: () => attemptsOf(world),
        reads: () => attemptReadsOf(world),
        coach: () => coachOf(world),
        db: () => world.db.primary,
        newLearner: () => ids.next(),
        premiumLearner: async () => {
            const learner = ids.next()
            await persistPremium(world.db.primary, learner)
            return learner
        },
    }
}
