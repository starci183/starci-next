import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { EssentialsExperienceService, InjectExperienceProducer, type ExperienceProducer } from "@modules/domain/career"
import { InjectNotificationProducer, type NotificationProducerPort } from "@modules/domain/notification"
import { StreakService } from "@modules/domain/streak"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { eachInOrder } from "@modules/platform/primitives"
import { AGENT_TRACKS, type EvidenceInput, type EvidenceRow } from "./project.contracts"
import { ProjectLogEvent } from "./project.log-events"
import type { CiReceipt, CiRunRecord } from "./project-params.contracts"
import { deployedExperienceOf, milestoneExperienceOf, type ExperienceSubject } from "./project-experience.policy"
import { InjectProjectLessons, type ProjectLessonPort } from "./project-lesson.port"
import { projectStandingOf, type ProjectStanding } from "./project-state.policy"
import { projectKindOf, toEvidenceRows } from "./project-view.mapper"
import type { EvidenceDbRow, ProbeRunRow, ProjectRow, SubjectRow } from "./persistence/project.rows"
import {
    INSERT_CI_RUN,
    INSERT_EVIDENCE,
    INSERT_PROOFS,
    SELECT_EVIDENCE,
    SELECT_LAST_PROBE_RUNS,
} from "./persistence/project.sql"

/** A proof that may be claimed once, with what to do the first time. */
interface ProofEffect {
    /** `concept:<id>`, `milestone:<id>` or `deployed`. */
    readonly subject: string
    /** Hands the rest of the app what it wants of the proof. */
    readonly run: () => Promise<void>
}

/** What the effects of a proof are built from. */
interface ProofContext {
    /** The project. */
    readonly project: ProjectRow
    /** Where it stands. */
    readonly standing: ProjectStanding
    /** The latest results. */
    readonly rows: ReadonlyArray<EvidenceRow>
    /** The newest probe run, or null. */
    readonly probeRun: ProbeRunRow | null
}

const CONCEPT_PREFIX = "concept:"
const MILESTONE_PREFIX = "milestone:"
const DEPLOYED = "deployed"

@Injectable()
/**
 * Appends the results every source reports (the machine over the relay, signed CI, a server probe, the AI teacher) and settles what
 * they prove. Evidence is append-only: a run reports a result once, and where a concept stands is always computed from the latest
 * results. Settling claims each newly proved concept, milestone and deployment once, and only then hands the rest of the app what it
 * wants: the experience item (CV lines come from the projects shard), the notification and the streak action of a run. A failing
 * side effect is logged and never undoes the proof.
 */
export class ProjectEvidenceService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
        @InjectProjectLessons() private readonly lessons: ProjectLessonPort,
        @InjectExperienceProducer() private readonly experiences: ExperienceProducer,
        private readonly essentials: EssentialsExperienceService,
        @InjectNotificationProducer() private readonly notifications: NotificationProducerPort,
        private readonly streak: StreakService,
    ) {}

    /** Appends results in the caller's transaction; a result the same run already reported adds nothing. Answers how many were new. */
    async append(manager: EntityManager, projectId: string, inputs: ReadonlyArray<EvidenceInput>): Promise<number> {
        const added = await Promise.all(
            inputs.map(async (input) => {
                const rows: Array<{ evidence_id: string }> = await manager.query(INSERT_EVIDENCE, [
                    projectId,
                    input.conceptId,
                    input.slot,
                    input.source,
                    input.passed,
                    input.ref,
                    input.runId,
                    input.commitSha,
                    JSON.stringify(input.detail),
                    input.at,
                ])
                return rows.length
            }),
        )
        return added.reduce((sum, count) => sum + count, 0)
    }

    /** Records a signed CI run once per run id, with its attestation, together with its results; a replay of the run id adds nothing. */
    recordCiRun(run: CiRunRecord): Promise<CiReceipt> {
        return this.entityManager.transaction(async (manager): Promise<CiReceipt> => {
            const recorded: Array<{ run_id: string }> = await manager.query(INSERT_CI_RUN, [
                run.projectId,
                run.runId,
                run.commit,
                run.passed,
                this.clock.now(),
                run.attestation,
            ])
            if (recorded[0] === undefined) return { duplicate: true, added: 0 }
            return { duplicate: false, added: await this.append(manager, run.projectId, run.results) }
        })
    }

    /**
     * Recomputes where the project stands after new results and acts on what is newly proved. Call it after the transaction that
     * appended the results has committed. `streakActionIds` are the runs that count as a meaningful `project-run` action.
     */
    async settle(project: ProjectRow, streakActionIds: ReadonlyArray<string>): Promise<void> {
        const evidence: Array<EvidenceDbRow> = await this.entityManager.query(SELECT_EVIDENCE, [
            [project.project_id],
            LIST_ROWS_MAX,
        ])
        const probeRuns: Array<ProbeRunRow> = await this.entityManager.query(SELECT_LAST_PROBE_RUNS, [
            [project.project_id],
            1,
        ])
        const lessons = await this.lessons.lessons({ locale: "vi" })
        const rows = toEvidenceRows(evidence)
        const standing = projectStandingOf(projectKindOf(project), rows, new Set(lessons.keys()))
        const candidates = this.effectsOf({ project, standing, rows, probeRun: probeRuns[0] ?? null })
        const claimed: Array<SubjectRow> =
            candidates.length === 0
                ? []
                : await this.entityManager.query(INSERT_PROOFS, [
                      project.project_id,
                      candidates.map((candidate) => candidate.subject),
                      this.clock.now(),
                  ])
        const fresh = new Set(claimed.map((row) => row.subject))
        await eachInOrder(
            candidates.filter((candidate) => fresh.has(candidate.subject)),
            (candidate) => this.guarded(candidate.subject, candidate.run),
        )
        await eachInOrder(streakActionIds, (actionId) =>
            this.guarded(actionId, async () => {
                await this.streak.recordStreakAction(project.learner_id, "projects", "project-run", { actionId })
            }),
        )
    }

    /** The proofs the project stands on now, each with what to do the first time it is claimed. */
    private effectsOf(context: ProofContext): ReadonlyArray<ProofEffect> {
        const { project, standing, rows, probeRun } = context
        const subject: ExperienceSubject = {
            learnerId: project.learner_id,
            projectId: project.project_id,
            name: project.name,
            stack: project.stack,
            kind: projectKindOf(project),
            track: AGENT_TRACKS.find((track) => track === project.track) ?? null,
            deployedUrl: project.deployed_url,
        }
        const concepts = standing.provedConceptIds.map((id): ProofEffect => ({
            subject: `${CONCEPT_PREFIX}${id}`,
            run: async () => {
                await this.essentials.record({
                    learnerId: project.learner_id,
                    lessonId: id,
                    project: { projectId: project.project_id, title: project.name, language: project.language },
                })
            },
        }))
        const milestones = standing.milestones
            .filter((milestone) => milestone.state === "done")
            .map(({ definition }): ProofEffect => ({
                subject: `${MILESTONE_PREFIX}${definition.id}`,
                run: async () => {
                    const own = rows.filter((row) => definition.concepts.includes(row.conceptId))
                    await this.experiences.produce(
                        milestoneExperienceOf({ subject, milestone: definition, rows: own, at: this.clock.now() }),
                    )
                    await this.notifications.notify(
                        project.learner_id,
                        "project.milestone-proved",
                        { project: project.name, milestone: definition.id },
                        `/projects/${project.project_id}/${definition.id}`,
                    )
                },
            }))
        const deployed: ReadonlyArray<ProofEffect> =
            probeRun?.passed === true
                ? [
                      {
                          subject: DEPLOYED,
                          run: async () => {
                              await this.experiences.produce(
                                  deployedExperienceOf({
                                      subject,
                                      runId: probeRun.run_id,
                                      url: probeRun.url,
                                      at: probeRun.at,
                                  }),
                              )
                              await this.notifications.notify(
                                  project.learner_id,
                                  "project.deployed",
                                  { project: project.name },
                                  `/projects/${project.project_id}`,
                              )
                          },
                      },
                  ]
                : []
        return [...concepts, ...milestones, ...deployed]
    }

    /** Runs one side effect of a proof; a failure is logged with the subject and goes no further. */
    private async guarded(subject: string, effect: () => Promise<void>): Promise<void> {
        try {
            await effect()
        } catch (cause) {
            this.logger.warn(ProjectLogEvent.ProofEffectFailed, {
                subject,
                error: cause instanceof Error ? cause.name : "unknown",
            })
        }
    }
}
