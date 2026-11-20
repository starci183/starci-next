import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { PracticeError, PracticeErrorCode } from "./errors/practice.error"
import { PRACTICE_PATTERNS, PRACTICE_PATTERN_IDS, patternTitleOf } from "./practice-catalog.policy"
import { languageNameOf } from "./practice-solution.policy"
import { failedTestIndexOf } from "./practice-verdict.policy"
import { toProblemItemView, toProblemView, toVerdict } from "./practice-view.mapper"
import type {
    PracticeNextParams,
    PracticeNextView,
    PracticePatternCompletionView,
    PracticePatternParams,
    PracticePatternView,
    PracticeProblemItemView,
    PracticeProblemParams,
    PracticeProblemView,
    PracticeReadParams,
    PracticeReadinessView,
} from "./practice.contracts"
import type {
    HintStepRow,
    NextProblemRow,
    PatternCompletionRow,
    PatternCountRow,
    PatternIntroRow,
    PatternLanguageRow,
    ProblemListRow,
    ProblemRow,
    ResumeProblemRow,
    StatusRow,
} from "./persistence/practice.rows"
import {
    SELECT_HINT_STEPS,
    SELECT_NEXT_PROBLEM,
    SELECT_PATTERN_COMPLETION,
    SELECT_PATTERN_COUNTS,
    SELECT_PATTERN_INTROS,
    SELECT_PATTERN_LANGUAGE,
    SELECT_PATTERN_PROBLEMS,
    SELECT_PROBLEM,
    SELECT_RESUME_PROBLEM,
    SELECT_STATUS,
} from "./persistence/practice.sql"

/** The learner id a guest read stands under: the nil uuid belongs to no learner, so every standing of a guest comes back empty. */
export const GUEST_LEARNER_ID = "00000000-0000-0000-0000-000000000000"

@Injectable()
/**
 * The learner reads of the practice capability: the patterns with the numbers of the viewer, the problems of a pattern, one
 * problem to open, the problem to do next and the readiness per pattern. Every problem is open to every learner and, to read, to a guest;
 * nothing a read returns holds a hidden test or a solution.
 */
export class PracticeReadService {
    constructor(@InjectPrimaryEntityManager() private readonly entityManager: EntityManager) {}

    /** The patterns that have problems, in catalog order, with the counts of the viewer and the introduction of each. */
    async patterns(params: PracticeReadParams): Promise<ReadonlyArray<PracticePatternView>> {
        const { learnerId, locale } = params
        const counts = await this.counts(learnerId)
        const intros = await this.intros(locale)
        return PRACTICE_PATTERNS.flatMap((pattern) => {
            const row = counts.get(pattern.id)
            if (row === undefined) return []
            return [
                {
                    patternId: pattern.id,
                    title: pattern.titles[locale],
                    problemCount: row.problem_count,
                    acceptedCount: row.accepted_count,
                    intro: intros.get(pattern.id) ?? "",
                },
            ]
        })
    }

    /** The problems of a pattern in order, with the standing of the viewer. */
    async problems(params: PracticePatternParams): Promise<ReadonlyArray<PracticeProblemItemView>> {
        const { learnerId, patternId, locale } = params
        if (!PRACTICE_PATTERNS.some((pattern) => pattern.id === patternId))
            throw new PracticeError({ code: PracticeErrorCode.PatternNotFound })
        const rows: Array<ProblemListRow> = await this.entityManager.query(SELECT_PATTERN_PROBLEMS, [
            learnerId,
            patternId,
            locale,
            LIST_ROWS_MAX,
        ])
        if (rows.length === 0) throw new PracticeError({ code: PracticeErrorCode.PatternNotFound })
        return rows.map((row) => toProblemItemView(row))
    }

    /** One problem to open: statement, examples, starter codes and the hint steps the viewer opened. */
    async problem(params: PracticeProblemParams): Promise<PracticeProblemView> {
        const { learnerId, slug, locale } = params
        const rows: Array<ProblemRow> = await this.entityManager.query(SELECT_PROBLEM, [slug])
        const row = rows[0]
        if (row === undefined) throw new PracticeError({ code: PracticeErrorCode.ProblemNotFound })
        const standing: Array<StatusRow> = await this.entityManager.query(SELECT_STATUS, [learnerId, slug])
        const steps: Array<HintStepRow> = await this.entityManager.query(SELECT_HINT_STEPS, [learnerId, slug])
        return toProblemView(
            row,
            locale,
            standing[0],
            steps.map((step) => step.step),
        )
    }

    /**
     * Where to go next: the first problem the learner has not got accepted (patterns in catalog order, problems in their order)
     * and the problem the learner most recently submitted without reaching Accepted; both restricted to one pattern when asked.
     */
    async next(params: PracticeNextParams): Promise<PracticeNextView> {
        const { learnerId, patternId, locale } = params
        if (patternId !== null && !PRACTICE_PATTERNS.some((pattern) => pattern.id === patternId))
            throw new PracticeError({ code: PracticeErrorCode.PatternNotFound })
        const nexts: Array<NextProblemRow> = await this.entityManager.query(SELECT_NEXT_PROBLEM, [
            learnerId,
            patternId,
            locale,
            PRACTICE_PATTERN_IDS,
        ])
        const resumes: Array<ResumeProblemRow> = await this.entityManager.query(SELECT_RESUME_PROBLEM, [
            learnerId,
            patternId,
            locale,
        ])
        const next = nexts[0]
        const resume = resumes[0]
        return {
            next:
                next === undefined
                    ? null
                    : {
                          slug: next.problem_id,
                          title: next.title,
                          patternId: next.pattern_id,
                          patternTitle: patternTitleOf(next.pattern_id, locale),
                          position: next.position,
                          patternProblemCount: next.pattern_problem_count,
                      },
            resume:
                resume === undefined
                    ? null
                    : {
                          slug: resume.problem_id,
                          title: resume.title,
                          patternId: resume.pattern_id,
                          patternTitle: patternTitleOf(resume.pattern_id, locale),
                          attempts: resume.attempts,
                          lastVerdict: toVerdict(resume.last_verdict),
                          failedTestIndex: failedTestIndexOf(resume.last_tests),
                      },
        }
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

    /**
     * What a learner has done in one pattern for the experience it may grant: the problems it has, the ones accepted and the
     * ones whose solution was revealed before the first Accepted. An unknown pattern, or one with no live problem, is not found.
     */
    async completion(params: PracticePatternParams): Promise<PracticePatternCompletionView> {
        const { learnerId, patternId, locale } = params
        const rows: Array<PatternCompletionRow> = await this.entityManager.query(SELECT_PATTERN_COMPLETION, [
            learnerId,
            patternId,
        ])
        const row = rows[0]
        if (row === undefined) throw new PracticeError({ code: PracticeErrorCode.PatternNotFound })
        const languages: Array<PatternLanguageRow> = await this.entityManager.query(SELECT_PATTERN_LANGUAGE, [
            learnerId,
            patternId,
        ])
        const language = languages[0]?.language
        return {
            patternId,
            title: patternTitleOf(patternId, locale),
            problemCount: row.problem_count,
            acceptedCount: row.accepted_count,
            viewedCount: row.viewed_count,
            language: language === undefined ? null : languageNameOf(language),
        }
    }

    private async counts(learnerId: string): Promise<Map<string, PatternCountRow>> {
        const rows: Array<PatternCountRow> = await this.entityManager.query(SELECT_PATTERN_COUNTS, [learnerId])
        return new Map(rows.map((row) => [row.pattern_id, row]))
    }

    private async intros(locale: string): Promise<Map<string, string>> {
        const rows: Array<PatternIntroRow> = await this.entityManager.query(SELECT_PATTERN_INTROS, [locale])
        return new Map(rows.map((row) => [row.pattern_id, row.intro]))
    }
}
