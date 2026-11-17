import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import type { ChallengeChoiceRow, HintUseRow, SectionReadRow } from "./persistence/attempt.rows"
import {
    INSERT_HINT_USE,
    INSERT_SECTION_READ,
    SELECT_CHALLENGE_CHOICES,
    SELECT_HINT_USES,
    SELECT_SECTION_READS,
} from "./persistence/attempt.sql"

/** The scenarios whose hint a learner asked for, by lesson. */
export type HintUsesByLesson = ReadonlyMap<string, ReadonlySet<string>>

@Injectable()
/**
 * The small learner marks of a four-part lesson: the scenario hints asked for ("có hỗ trợ"), the article sections marked as read
 * ("nên đọc kỹ" clears), and whether each challenge essence question is right now. Every write is idempotent.
 */
export class AttemptMarkService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /** Records that the learner asked for the hint of a scenario; asking again changes nothing. */
    async useHint(learnerId: string, lessonId: string, scenarioId: string): Promise<void> {
        await this.entityManager.query(INSERT_HINT_USE, [learnerId, lessonId, scenarioId, this.clock.now()])
    }

    /** The scenarios whose hint the learner asked for in each of some lessons. */
    async hintUses(learnerId: string, lessonIds: ReadonlyArray<string>): Promise<HintUsesByLesson> {
        const rows: Array<HintUseRow> =
            lessonIds.length === 0
                ? []
                : await this.entityManager.query(SELECT_HINT_USES, [learnerId, [...lessonIds], LIST_ROWS_MAX])
        const byLesson = new Map<string, Set<string>>()
        for (const row of rows)
            byLesson.set(row.lesson_id, (byLesson.get(row.lesson_id) ?? new Set()).add(row.scenario_id))
        return byLesson
    }

    /** Records that the learner marked a section of a lesson as read; marking again changes nothing. */
    async markSectionRead(learnerId: string, lessonId: string, sectionId: string): Promise<void> {
        await this.entityManager.query(INSERT_SECTION_READ, [learnerId, lessonId, sectionId, this.clock.now()])
    }

    /** The ids of the sections the learner marked as read in a lesson, oldest first. */
    async readSectionIds(learnerId: string, lessonId: string): Promise<ReadonlyArray<string>> {
        const rows: Array<SectionReadRow> = await this.entityManager.query(SELECT_SECTION_READS, [
            learnerId,
            lessonId,
            LIST_ROWS_MAX,
        ])
        return rows.map((row) => row.section_id)
    }

    /**
     * The challenge essence questions the learner answered in each of some lessons, each with whether its newest graded answer is
     * right; the key is the activity id `challenge.<challenge id>.<question id>`.
     */
    async challengeChoices(
        learnerId: string,
        lessonIds: ReadonlyArray<string>,
    ): Promise<ReadonlyMap<string, ReadonlyMap<string, boolean>>> {
        const rows: Array<ChallengeChoiceRow> =
            lessonIds.length === 0
                ? []
                : await this.entityManager.query(SELECT_CHALLENGE_CHOICES, [learnerId, [...lessonIds], LIST_ROWS_MAX])
        const byLesson = new Map<string, Map<string, boolean>>()
        for (const row of rows)
            byLesson.set(
                row.lesson_id,
                (byLesson.get(row.lesson_id) ?? new Map()).set(row.activity_id, row.latest_correct === true),
            )
        return byLesson
    }
}
