import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { PracticeError, PracticeErrorCode } from "./errors/practice.error"
import { PRACTICE_PATTERNS } from "./practice-catalog.policy"
import { decodedSubmissionsCursor, encodedSubmissionsCursor, submissionsPageLimit } from "./practice-page.policy"
import { settingsOf } from "./practice-settings.policy"
import { toSubmissionItemView } from "./practice-view.mapper"
import { InjectPracticeOptions } from "./practice.decorators"
import type { PracticeSubmissionsPageView, PracticeSubmissionsParams } from "./practice.contracts"
import type { PracticeOptions } from "./practice.options"
import type { SubmissionHistoryRow } from "./persistence/practice.rows"
import { SELECT_SUBMISSION_HISTORY } from "./persistence/practice.sql"

@Injectable()
/** The graded submits a learner sent in one pattern, newest first, read by an opaque keyset cursor; only the rows of the learner named are read. */
export class PracticeHistoryService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectPracticeOptions() private readonly options: PracticeOptions,
    ) {}

    /**
     * One page of the graded submits of a learner in a pattern (runs and submits still judging are left out), newest first.
     * The cursor is the one the page before answered; a foreign one is PRACTICE_CURSOR_INVALID and an unknown pattern is
     * PRACTICE_PATTERN_NOT_FOUND. The limit defaults to the `submissionsPage` setting and is at most 50.
     */
    async submissions(params: PracticeSubmissionsParams): Promise<PracticeSubmissionsPageView> {
        const { learnerId, patternId, locale } = params
        if (!PRACTICE_PATTERNS.some((pattern) => pattern.id === patternId))
            throw new PracticeError({ code: PracticeErrorCode.PatternNotFound })
        const cursor = params.cursor === null ? null : decodedSubmissionsCursor(params.cursor)
        const limit = submissionsPageLimit(params.limit, settingsOf(this.options).submissionsPage)
        const rows: Array<SubmissionHistoryRow> = await this.entityManager.query(SELECT_SUBMISSION_HISTORY, [
            learnerId,
            patternId,
            locale,
            cursor?.submittedAt ?? null,
            cursor?.id ?? null,
            limit + 1,
        ])
        const kept = rows.slice(0, limit)
        const last = kept.at(-1)
        return {
            items: kept.map((row) => toSubmissionItemView(row)),
            next:
                last !== undefined && rows.length > limit
                    ? encodedSubmissionsCursor({ submittedAt: last.created_at.toISOString(), id: last.submission_id })
                    : null,
        }
    }
}
