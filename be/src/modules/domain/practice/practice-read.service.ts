import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { PracticeError, PracticeErrorCode } from "./errors/practice.error"
import { PRACTICE_PATTERNS, patternTitleOf } from "./practice-catalog.policy"
import { isBeyondFree } from "./practice-access.policy"
import { InjectPracticeOptions } from "./practice.decorators"
import type { PracticeOptions } from "./practice.options"
import { settingsOf } from "./practice-settings.policy"
import { statusOf, toProblemItemView, toProblemView } from "./practice-view.mapper"
import type {
    PracticePatternParams,
    PracticePatternView,
    PracticeProblemItemView,
    PracticeProblemParams,
    PracticeProblemView,
    PracticeReadParams,
    PracticeReadinessView,
} from "./practice.contracts"
import type { HintStepRow, PatternCountRow, ProblemListRow, ProblemRow, StatusRow } from "./persistence/practice.rows"
import {
    SELECT_HINT_STEPS,
    SELECT_PATTERN_COUNTS,
    SELECT_PATTERN_PROBLEMS,
    SELECT_PROBLEM,
    SELECT_STATUS,
} from "./persistence/practice.sql"

@Injectable()
/**
 * The learner reads of the practice capability: the patterns with the numbers of the viewer, the problems of a pattern, one
 * problem to open and the readiness per pattern. Nothing it returns holds a hidden test or a solution; without Premium only
 * the first problems of each pattern (the free ones) are open and the others answer their statement only.
 */
export class PracticeReadService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectPracticeOptions() private readonly options: PracticeOptions,
    ) {}

    /** The patterns that have problems, in catalog order, with the counts and the lock state of the viewer. */
    async patterns(params: PracticeReadParams): Promise<ReadonlyArray<PracticePatternView>> {
        const { learnerId, locale } = params
        const premium = await this.entitlement.isPremium(learnerId)
        const free = settingsOf(this.options).freePerPattern
        const counts = await this.counts(learnerId)
        return PRACTICE_PATTERNS.flatMap((pattern) => {
            const row = counts.get(pattern.id)
            if (row === undefined) return []
            const freeCount = premium ? row.problem_count : Math.min(free, row.problem_count)
            return [
                {
                    patternId: pattern.id,
                    title: pattern.titles[locale],
                    problemCount: row.problem_count,
                    acceptedCount: row.accepted_count,
                    freeCount,
                    locked: freeCount < row.problem_count,
                },
            ]
        })
    }

    /** The problems of a pattern in order, with the standing of the viewer and which ones need Premium. */
    async problems(params: PracticePatternParams): Promise<ReadonlyArray<PracticeProblemItemView>> {
        const { learnerId, patternId, locale } = params
        if (!PRACTICE_PATTERNS.some((pattern) => pattern.id === patternId))
            throw new PracticeError({ code: PracticeErrorCode.PatternNotFound })
        const premium = await this.entitlement.isPremium(learnerId)
        const free = settingsOf(this.options).freePerPattern
        const rows: Array<ProblemListRow> = await this.entityManager.query(SELECT_PATTERN_PROBLEMS, [
            learnerId,
            patternId,
            locale,
            LIST_ROWS_MAX,
        ])
        if (rows.length === 0) throw new PracticeError({ code: PracticeErrorCode.PatternNotFound })
        return rows.map((row, rank) => toProblemItemView(row, !premium && isBeyondFree(rank, free)))
    }

    /** One problem to open: statement, examples, starter codes and the hint steps the viewer opened. */
    async problem(params: PracticeProblemParams): Promise<PracticeProblemView> {
        const { learnerId, slug, locale } = params
        const rows: Array<ProblemRow> = await this.entityManager.query(SELECT_PROBLEM, [slug])
        const row = rows[0]
        if (row === undefined) throw new PracticeError({ code: PracticeErrorCode.ProblemNotFound })
        const premium = await this.entitlement.isPremium(learnerId)
        const locked = !premium && isBeyondFree(row.rank, settingsOf(this.options).freePerPattern)
        const standing: Array<StatusRow> = await this.entityManager.query(SELECT_STATUS, [learnerId, slug])
        const steps: Array<HintStepRow> = await this.entityManager.query(SELECT_HINT_STEPS, [learnerId, slug])
        return toProblemView(
            row,
            locale,
            locked,
            statusOf(standing[0]?.status),
            steps.map((step) => step.step),
        )
    }

    /** How many problems of each pattern the learner got accepted: the practice side of hiring readiness. */
    async readiness(params: PracticeReadParams): Promise<ReadonlyArray<PracticeReadinessView>> {
        const { learnerId, locale } = params
        const counts = await this.counts(learnerId)
        return PRACTICE_PATTERNS.flatMap((pattern) => {
            const row = counts.get(pattern.id)
            return row === undefined
                ? []
                : [
                      {
                          patternId: pattern.id,
                          title: patternTitleOf(pattern.id, locale),
                          problemCount: row.problem_count,
                          acceptedCount: row.accepted_count,
                      },
                  ]
        })
    }

    private async counts(learnerId: string): Promise<Map<string, PatternCountRow>> {
        const rows: Array<PatternCountRow> = await this.entityManager.query(SELECT_PATTERN_COUNTS, [learnerId])
        return new Map(rows.map((row) => [row.pattern_id, row]))
    }
}
