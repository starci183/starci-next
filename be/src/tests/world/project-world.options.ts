import { Injectable, Module, type Type } from "@nestjs/common"
import type { ModuleFactory } from "@starci/test-world"
import type { EntityManager } from "typeorm"
import { AttemptModule } from "@modules/domain/attempt"
import { CareerModule, ExperienceReadService } from "@modules/domain/career"
import { EntitlementModule } from "@modules/domain/entitlement"
import { LessonModule } from "@modules/domain/lesson"
import { NotificationInboxService, NotificationModule } from "@modules/domain/notification"
import {
    type CiAttestation,
    type CiAttestationRequest,
    type CiAttestationVerifier,
    ProjectCiService,
    ProjectCiProofService,
    ProjectCodeReadService,
    ProjectModule,
    ProjectPracticeService,
    ProjectProbeService,
    ProjectReadService,
    ProjectRepositoryService,
    ProjectService,
    type RelayCheckResult,
    type RelayResultsRequest,
} from "@modules/domain/project"
import { StreakModule, StreakService } from "@modules/domain/streak"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { InboxModule } from "@modules/platform/inbox"
import { PROBE_TRANSPORT, type ProbeReply, type ProbeTransport } from "@modules/integrations/probe"

/** The concepts of the first milestone, which the world's lessons cover; every other concept is still being written. */
export const WORLD_CONCEPTS: ReadonlyArray<string> = [
    "request-response-lifecycle",
    "health-probe-semantics",
    "unit-testing-behavior",
]

@Injectable()
/** The lessons of the world: the first milestone's concepts exist and each has one rubric with two criteria. */
export class WorldProjectLessons {
    /** The live lessons by id. */
    lessons(): Promise<ReadonlyMap<string, { id: string; version: string; title: string; topicId: string }>> {
        return Promise.resolve(
            new Map(WORLD_CONCEPTS.map((id) => [id, { id, version: "v1", title: id, topicId: "http" }])),
        )
    }

    /** One rubric of two criteria. */
    rubricOf(): Promise<{
        criteria: ReadonlyArray<{ id: string; criterion: string; expectedEvidence: string; misconception: string }>
    }> {
        return Promise.resolve({
            criteria: ["c1", "c2"].map((id) => ({ id, criterion: id, expectedEvidence: id, misconception: id })),
        })
    }
}

@Injectable()
/** The AI teacher of the world: it passes every explanation with the same question. */
export class WorldProjectCoach {
    /** A pass on both criteria. */
    read(): Promise<{
        criteria: ReadonlyArray<{ criterionId: string; level: number; evidenceQuote: string }>
        question: string
    }> {
        return Promise.resolve({
            criteria: [
                { criterionId: "c1", level: 2, evidenceQuote: "quote" },
                { criterionId: "c2", level: 2, evidenceQuote: "quote" },
            ],
            question: "Where is it stored?",
        })
    }
}

@Injectable()
/** The relay of the world: a spec pushes what the learner machine would report, and the port reads it back once per event. */
export class WorldProjectRelay {
    private readonly pushed: Array<RelayCheckResult> = []

    /** Reports results as the learner machine would. */
    push(...results: ReadonlyArray<RelayCheckResult>): void {
        this.pushed.push(...results)
    }

    /** The reported results of the project. */
    checkResults(request: RelayResultsRequest): Promise<ReadonlyArray<RelayCheckResult>> {
        return Promise.resolve(this.pushed.filter((result) => request.after === null || result.at > request.after))
    }
}

/** The OIDC token the world's GitHub vouches for: the repository, the commit and the run id it names, joined by `|`. */
export const worldOidcTokenOf = (repository: string, commit: string, runId: string): string =>
    `${repository}|${commit}|${runId}`

@Injectable()
/**
 * The GitHub of the world: it vouches for a token `worldOidcTokenOf` minted, compared as the real verifier compares the claims
 * (repository without case, commit, run id), and names repository id `4242`; no network, no keys.
 */
export class WorldCiAttestation implements CiAttestationVerifier {
    /** Attests a token naming the request's repository, commit and run, else answers what did not match. */
    attest(request: CiAttestationRequest): Promise<CiAttestation> {
        const [repository, commit, runId] = request.token.split("|")
        if (runId === undefined) return Promise.resolve({ kind: "signed-only", reason: "token" })
        if (repository?.toLowerCase() !== request.repository.toLowerCase()) {
            return Promise.resolve({ kind: "signed-only", reason: "repository" })
        }
        if (commit !== request.commit) return Promise.resolve({ kind: "signed-only", reason: "commit" })
        if (runId !== request.runId) return Promise.resolve({ kind: "signed-only", reason: "run" })
        return Promise.resolve({ kind: "attested", repositoryId: "4242" })
    }
}

@Injectable()
/** The probe transport of the world: no network. A host name the spec marks as inside is not public, and a request is answered with the reply the spec set. */
export class WorldProbeTransport implements ProbeTransport {
    /** What every request is answered with: a refused target until a spec says otherwise. */
    reply: ProbeReply = { ok: false, error: "target-refused" }
    /** The host names that resolve to a non-public address. */
    readonly inside: Set<string> = new Set<string>(["127.0.0.1.nip.io"])

    /** Answers the reply of the spec. */
    send(): Promise<ProbeReply> {
        return Promise.resolve(this.reply)
    }

    /** True unless the spec marked the name as inside. */
    isPublicHost(hostname: string): Promise<boolean> {
        return Promise.resolve(!this.inside.has(hostname))
    }
}

@Module({
    providers: [WorldProbeTransport, { provide: PROBE_TRANSPORT, useExisting: WorldProbeTransport }],
    exports: [PROBE_TRANSPORT, WorldProbeTransport],
})
/** The probe module of the world: the transport above, so no spec opens a connection. */
export class WorldProbeModule {}

/** The modules of the project worlds: the capability over the real entitlement, career, streak and notification capabilities. */
export const projectModules: ReadonlyArray<ModuleFactory> = [
    () => ({
        ...ProjectModule.register({
            relay: WorldProjectRelay,
            coach: WorldProjectCoach,
            lessons: WorldProjectLessons,
            attestation: WorldCiAttestation,
        }),
        imports: [
            EntitlementModule.register({ isGlobal: true }),
            LessonModule.register({ isGlobal: true }),
            AttemptModule.register({ isGlobal: true }),
            CareerModule.register({ isGlobal: true }),
            StreakModule.register({ isGlobal: true }),
            NotificationModule.register({ isGlobal: true }),
            InboxModule.register({ isGlobal: true, connection: PRIMARY_ENTITY_MANAGER }),
            WorldProbeModule,
        ],
    }),
]

/** The databases of a booted world. */
export interface ProjectWorldDatabases {
    /** The primary database. */
    readonly primary?: EntityManager | undefined
}

/** What a booted project world resolves providers with. */
export interface ProjectWorldHandle {
    /** Answers the provider registered under the class. */
    resolve<TProvider>(token: Type<TProvider>): TProvider
    /** The databases of the world. */
    readonly db: ProjectWorldDatabases
}

/** The services of the project capability a spec drives, over the real database. */
export interface ProjectWorld {
    /** The writes. */
    projects(): ProjectService
    /** The reads. */
    reads(): ProjectReadService
    /** The signed CI intake. */
    ci(): ProjectCiService
    /** The proof of a signed CI delivery, the door's first call. */
    proof(): ProjectCiProofService
    /** The GitHub repository binding. */
    repositories(): ProjectRepositoryService
    /** The AI code read. */
    codeReads(): ProjectCodeReadService
    /** The practice pull. */
    practice(): ProjectPracticeService
    /** The server probe runner. */
    probeRuns(): ProjectProbeService
    /** The probe transport of the world. */
    probes(): WorldProbeTransport
    /** The relay of the world. */
    relay(): WorldProjectRelay
    /** The experience items of a learner. */
    experiences(): ExperienceReadService
    /** The notification inbox. */
    notifications(): NotificationInboxService
    /** The streak. */
    streak(): StreakService
    /** The primary database. */
    db(): EntityManager | undefined
}

/** Wraps the world a spec booted with `useTestWorld({ modules: projectModules })`. Call it inside `describe`. */
export const useProjectWorld = (world: ProjectWorldHandle): ProjectWorld => ({
    projects: () => world.resolve(ProjectService),
    reads: () => world.resolve(ProjectReadService),
    ci: () => world.resolve(ProjectCiService),
    proof: () => world.resolve(ProjectCiProofService),
    repositories: () => world.resolve(ProjectRepositoryService),
    codeReads: () => world.resolve(ProjectCodeReadService),
    practice: () => world.resolve(ProjectPracticeService),
    probeRuns: () => world.resolve(ProjectProbeService),
    probes: () => world.resolve(WorldProbeTransport),
    relay: () => world.resolve(WorldProjectRelay),
    experiences: () => world.resolve(ExperienceReadService),
    notifications: () => world.resolve(NotificationInboxService),
    streak: () => world.resolve(StreakService),
    db: () => world.db.primary,
})
