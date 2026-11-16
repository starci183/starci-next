import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectProbeTransport, type ProbeTransport } from "@modules/integrations/probe"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { CheckFlowRunner, type FlowPorts, type FlowVerdict } from "@modules/platform/check-flow"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { eachInOrder } from "@modules/platform/primitives"
import { InjectTimer, type Timer } from "@modules/platform/retry"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import type { EvidenceInput, ProjectSettings } from "./project.contracts"
import { InjectProjectOptions } from "./project.decorators"
import { assertSubscriber } from "./project-access.policy"
import type { ProjectOptions } from "./project.options"
import type { CheckProbe, CheckSet } from "./project-check-set.contracts"
import { ProjectCheckSetService } from "./project-check-set.service"
import { ProjectEvidenceService } from "./project-evidence.service"
import { ProjectProbeSinkService } from "./project-probe-sink.service"
import { projectSettingsOf } from "./project-settings.policy"
import { publicTargetOf } from "./project-target.policy"
import type { ProbeRunView } from "./project-view.contracts"
import { projectKindOf, toProbeRunView } from "./project-view.mapper"
import type { ConceptRow, ProjectRow, TotalRow } from "./persistence/project.rows"
import { COUNT_PROBE_RUNS, INSERT_PROBE_RUN, SELECT_CONCEPTS, SELECT_PROJECT } from "./persistence/project.sql"

/** The most probes one run executes, and how many go at once. */
const MAX_PROBES = 24
const BATCH = 3
const HOUR_MS = 3_600_000

/** The probe a run always sends to the deployment itself when no concept carries it. */
export const DEPLOYMENT_PROBE = "health"

/** One probe of a run: aimed at a concept's endpoint, or the deployment itself. */
interface ProbeTask {
    /** The concept it proves for, or null for the deployment probe. */
    readonly conceptId: string | null
    /** The probe id. */
    readonly probeId: string
}

/** A probe task with what its flow concluded. */
interface ProbeOutcome {
    /** The task. */
    readonly task: ProbeTask
    /** The verdict of the flow. */
    readonly verdict: FlowVerdict
    /** The probe's texts, for the evidence. */
    readonly probe: CheckProbe
}

/** Whether a verdict judged the project: passed or failed. Skipped and unanswered prove nothing either way. */
const isJudged = (outcome: ProbeOutcome): boolean =>
    outcome.verdict.status === "passed" || outcome.verdict.status === "failed"

const evidenceOf = (outcomes: ReadonlyArray<ProbeOutcome>, runId: string, at: Date): ReadonlyArray<EvidenceInput> =>
    outcomes.flatMap((outcome) =>
        outcome.task.conceptId === null
            ? []
            : [
                  {
                      conceptId: outcome.task.conceptId,
                      slot: "probe" as const,
                      source: "server-probe" as const,
                      passed: outcome.verdict.status === "passed",
                      ref: outcome.task.probeId,
                      runId,
                      commitSha: null,
                      detail: {
                          reason: outcome.verdict.reason,
                          facts: outcome.verdict.facts,
                          text: outcome.probe.reasons[outcome.verdict.reason] ?? null,
                          question: outcome.probe.question,
                      },
                      at,
                  },
              ],
    )

@Injectable()
/**
 * The server probe runner (proof). Every probe is data, a check-flow file of the content repository, run by the one interpreter the
 * CLI also uses; this service only picks the probes of the project's milestones and binds the guarded transport (public http or
 * https only, the address checked at connection, no redirect, a deadline and a byte cap) and the public sink. Projects are for
 * subscribers only: a learner without Premium is refused with PROJECT_PREMIUM_REQUIRED before anything is sent, and a project may be
 * probed only a few times an hour. A probe skipped for a missing declaration or left unanswered moves no concept.
 */
export class ProjectProbeService {
    private readonly settings: ProjectSettings

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectTimer() private readonly timer: Timer,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectProjectOptions() options: ProjectOptions,
        @InjectProbeTransport() private readonly http: ProbeTransport,
        private readonly evidence: ProjectEvidenceService,
        private readonly checks: ProjectCheckSetService,
        private readonly sink: ProjectProbeSinkService,
    ) {
        this.settings = projectSettingsOf(options)
    }

    /** Probes the project's deployed address, records the run and its evidence, settles the project and answers the run. */
    async run(learnerId: string, projectId: string): Promise<ProbeRunView> {
        await assertSubscriber(this.entitlement, learnerId)
        const found: Array<ProjectRow> = await this.entityManager.query(SELECT_PROJECT, [learnerId, projectId])
        const [project] = found
        if (project === undefined) throw new ProjectError({ code: ProjectErrorCode.NotFound })
        if (project.deployed_url === null) throw new ProjectError({ code: ProjectErrorCode.DeployedUrlMissing })
        const base = publicTargetOf(project.deployed_url)
        const now = this.clock.now()
        const counted: Array<TotalRow> = await this.entityManager.query(COUNT_PROBE_RUNS, [
            project.project_id,
            new Date(now.getTime() - HOUR_MS),
        ])
        if ((counted[0]?.total ?? 0) >= this.settings.probeRunsPerHour) {
            throw new ProjectError({ code: ProjectErrorCode.ProbeRateLimited })
        }
        const set = await this.checks.current()
        const pointerRows: Array<ConceptRow> = await this.entityManager.query(SELECT_CONCEPTS, [
            [project.project_id],
            LIST_ROWS_MAX,
        ])
        const pointers = new Map(pointerRows.map((pointer) => [pointer.concept_id, pointer]))
        const outcomes = await this.execute(set, this.tasksOf(set, project), base, pointers, now)
        const judged = outcomes.filter(isJudged)
        const passed = judged.length > 0 && judged.every((outcome) => outcome.verdict.status === "passed")
        const results = outcomes.map((outcome) => ({
            probeId: outcome.task.probeId,
            conceptId: outcome.task.conceptId,
            passed: outcome.verdict.status === "passed",
            reason: outcome.verdict.reason,
            facts: outcome.verdict.facts,
        }))
        const runId = await this.entityManager.transaction(async (manager) => {
            const inserted: Array<{ run_id: string }> = await manager.query(INSERT_PROBE_RUN, [
                project.project_id,
                base,
                passed,
                JSON.stringify(results),
                now,
            ])
            const id = String(inserted[0]?.run_id)
            await this.evidence.append(manager, project.project_id, evidenceOf(judged, id, now))
            return id
        })
        await this.evidence.settle(project, [`probe:${runId}`])
        return toProbeRunView({ project_id: project.project_id, run_id: runId, url: base, passed, results, at: now })
    }

    /** The probes of the concepts of every milestone the project's kind lists, then the deployment probe when no concept carries it. */
    private tasksOf(set: CheckSet, project: ProjectRow): ReadonlyArray<ProbeTask> {
        const listed = set.kinds[projectKindOf(project)]
        const conceptIds = new Set(
            set.milestones
                .filter((milestone) => listed.includes(milestone.id))
                .flatMap((milestone) => milestone.concepts),
        )
        const fromConcepts = set.concepts
            .filter((concept) => conceptIds.has(concept.id))
            .flatMap((concept) => concept.probes.map((probeId): ProbeTask => ({ conceptId: concept.id, probeId })))
        const carried =
            fromConcepts.some((task) => task.probeId === DEPLOYMENT_PROBE) || !set.probes.has(DEPLOYMENT_PROBE)
        const tasks = carried ? fromConcepts : [{ conceptId: null, probeId: DEPLOYMENT_PROBE }, ...fromConcepts]
        return tasks.slice(0, MAX_PROBES)
    }

    /** Runs the tasks a few at a time, one batch after the other. */
    private async execute(
        set: CheckSet,
        tasks: ReadonlyArray<ProbeTask>,
        base: string,
        pointers: ReadonlyMap<string, ConceptRow>,
        now: Date,
    ): Promise<ReadonlyArray<ProbeOutcome>> {
        const outcomes: Array<ProbeOutcome> = []
        const runner = new CheckFlowRunner(this.ports())
        const starts = tasks.filter((_task, index) => index % BATCH === 0).map((_task, batch) => batch * BATCH)
        await eachInOrder(starts, async (start) => {
            const batch = await Promise.all(
                tasks.slice(start, start + BATCH).flatMap((task, offset) => {
                    const probe = set.probes.get(task.probeId)
                    if (probe === undefined) return []
                    const pointer = task.conceptId === null ? undefined : pointers.get(task.conceptId)
                    return [
                        runner
                            .run(probe.flow, {
                                base,
                                endpoint: pointer?.endpoint ?? null,
                                sample: pointer?.sample_body ?? null,
                                runId: `probe-${now.getTime()}-${start + offset}`,
                            })
                            .then((verdict): ProbeOutcome => ({ task, verdict, probe })),
                    ]
                }),
            )
            outcomes.push(...batch)
        })
        return outcomes
    }

    /** The ports of the server's runs: the guarded transport with the caps, the public sink when declared, the timer. */
    private ports(): FlowPorts {
        const limits = { timeoutMs: this.settings.probeTimeoutMs, maxBytes: this.settings.probeMaxBytes }
        return {
            transport: { send: (request) => this.http.send({ ...request, ...limits }) },
            sink: this.sink.available ? this.sink : null,
            clock: {
                now: () => performance.now(),
                sleep: (ms) =>
                    new Promise<void>((resolve) => {
                        this.timer.schedule(resolve, ms)
                    }),
            },
        }
    }
}
