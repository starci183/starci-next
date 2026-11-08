import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectProbeTransport, type ProbeReply, type ProbeTransport } from "@modules/integrations/probe"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { eachInOrder } from "@modules/platform/primitives"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import type { EvidenceInput, ProbeId, ProjectSettings } from "./project.contracts"
import { InjectProjectOptions } from "./project.decorators"
import type { ProjectOptions } from "./project.options"
import { milestonesOfKind, PROJECT_CONCEPTS } from "./project-catalog.policy"
import { ProjectEvidenceService } from "./project-evidence.service"
import { judgeProbe, planOf, type ProbePlan, type ProbeVerdict } from "./project-probe.policy"
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

/** One probe of a run: aimed at a concept's endpoint, or the deployment itself. */
interface ProbeTask {
    /** The concept it proves for, or null for the deployment probe. */
    readonly conceptId: string | null
    /** The probe. */
    readonly probeId: ProbeId
}

/** A probe task with what it concluded and whether it ran at all. */
interface ProbeOutcome {
    /** The task. */
    readonly task: ProbeTask
    /** The verdict. */
    readonly verdict: ProbeVerdict
    /** False when the probe did not run: it could not be planned (an endpoint the learner has not declared) or a request got no response (refused address, network, deadline); it proves nothing either way. */
    readonly executed: boolean
}

const evidenceOf = (outcomes: ReadonlyArray<ProbeOutcome>, runId: string, at: Date): ReadonlyArray<EvidenceInput> =>
    outcomes.flatMap((outcome) =>
        outcome.task.conceptId === null
            ? []
            : [
                  {
                      conceptId: outcome.task.conceptId,
                      slot: "probe" as const,
                      source: "server-probe" as const,
                      passed: outcome.verdict.passed,
                      ref: outcome.task.probeId,
                      runId,
                      commitSha: null,
                      detail: { reason: outcome.verdict.reason, facts: outcome.verdict.facts },
                      at,
                  },
              ],
    )

@Injectable()
/**
 * The server probe runner (proof): it calls the deployed address of a project with the generic StarCi probes, aimed at the
 * endpoints the learner declared for each concept. Every request goes through the guarded client (public http or https only,
 * address checked at connection, no redirect, a deadline and a byte cap), a project may be probed only a few times an hour, and a
 * learner without Premium is probed only for the free milestones. A probe that needs an endpoint the learner has not declared is
 * reported as such and proves nothing.
 */
export class ProjectProbeService {
    private readonly settings: ProjectSettings

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectProjectOptions() options: ProjectOptions,
        @InjectProbeTransport() private readonly http: ProbeTransport,
        private readonly evidence: ProjectEvidenceService,
    ) {
        this.settings = projectSettingsOf(options)
    }

    /** Probes the project's deployed address, records the run and its evidence, settles the project and answers the run. */
    async run(learnerId: string, projectId: string): Promise<ProbeRunView> {
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
        const pointerRows: Array<ConceptRow> = await this.entityManager.query(SELECT_CONCEPTS, [
            [project.project_id],
            LIST_ROWS_MAX,
        ])
        const pointers = new Map(pointerRows.map((pointer) => [pointer.concept_id, pointer]))
        const tasks = await this.tasksOf(learnerId, project)
        const outcomes = await this.execute(tasks, base, pointers, now)
        const executed = outcomes.filter((outcome) => outcome.executed)
        const passed = executed.length > 0 && executed.every((outcome) => outcome.verdict.passed)
        const results = outcomes.map((outcome) => ({
            probeId: outcome.task.probeId,
            conceptId: outcome.task.conceptId,
            passed: outcome.verdict.passed,
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
            await this.evidence.append(manager, project.project_id, evidenceOf(executed, id, now))
            return id
        })
        await this.evidence.settle(project, [`probe:${runId}`])
        return toProbeRunView({ project_id: project.project_id, run_id: runId, url: base, passed, results, at: now })
    }

    /** The probes of a run: those of every concept the learner may open, then the deployment's health probe when no concept carries it. */
    private async tasksOf(learnerId: string, project: ProjectRow): Promise<ReadonlyArray<ProbeTask>> {
        const premium = await this.entitlement.isPremium(learnerId)
        const open = milestonesOfKind(projectKindOf(project)).filter(
            (milestone) => premium || this.settings.freeMilestones.includes(milestone.id),
        )
        const conceptIds = new Set(open.flatMap((milestone) => milestone.concepts))
        const fromConcepts = PROJECT_CONCEPTS.filter((concept) => conceptIds.has(concept.id)).flatMap((concept) =>
            concept.probes.map((probeId): ProbeTask => ({ conceptId: concept.id, probeId })),
        )
        const health: ProbeTask = { conceptId: null, probeId: "health" }
        const tasks = fromConcepts.some((task) => task.probeId === "health") ? fromConcepts : [health, ...fromConcepts]
        return tasks.slice(0, MAX_PROBES)
    }

    /** Runs the tasks a few at a time, one batch after the other. */
    private async execute(
        tasks: ReadonlyArray<ProbeTask>,
        base: string,
        pointers: ReadonlyMap<string, ConceptRow>,
        now: Date,
    ): Promise<ReadonlyArray<ProbeOutcome>> {
        const outcomes: Array<ProbeOutcome> = []
        const starts = tasks.filter((_task, index) => index % BATCH === 0).map((_task, batch) => batch * BATCH)
        await eachInOrder(starts, async (start) => {
            const batch = await Promise.all(
                tasks.slice(start, start + BATCH).map((task, offset) => {
                    const pointer = task.conceptId === null ? undefined : pointers.get(task.conceptId)
                    return this.probe(task, base, pointer, `probe-${now.getTime()}-${start + offset}`)
                }),
            )
            outcomes.push(...batch)
        })
        return outcomes
    }

    private async probe(
        task: ProbeTask,
        base: string,
        pointer: ConceptRow | undefined,
        requestId: string,
    ): Promise<ProbeOutcome> {
        const planning = planOf(task.probeId, {
            base,
            endpoint: pointer?.endpoint ?? null,
            sampleBody: pointer?.sample_body ?? null,
            parallel: this.settings.probeParallel,
            requestId,
        })
        if (planning.kind === "skipped") {
            return { task, executed: false, verdict: { passed: false, reason: planning.reason, facts: {} } }
        }
        const replies = await this.send(planning.plan)
        const unanswered = replies.find((reply) => !reply.ok)
        if (unanswered !== undefined && !unanswered.ok) {
            // A request that got no response says nothing about the project (the address was refused, the network broke, the deadline passed): the probe did not run, so it moves no concept.
            return { task, executed: false, verdict: { passed: false, reason: unanswered.error, facts: {} } }
        }
        return { task, executed: true, verdict: judgeProbe(task.probeId, replies) }
    }

    private async send(plan: ProbePlan): Promise<ReadonlyArray<ProbeReply>> {
        const limits = { timeoutMs: this.settings.probeTimeoutMs, maxBytes: this.settings.probeMaxBytes }
        if (plan.mode === "parallel") {
            return Promise.all(plan.requests.map((request) => this.http.send({ ...request, ...limits })))
        }
        const replies: Array<ProbeReply> = []
        await eachInOrder(plan.requests, async (request) => {
            replies.push(await this.http.send({ ...request, ...limits }))
        })
        return replies
    }
}
