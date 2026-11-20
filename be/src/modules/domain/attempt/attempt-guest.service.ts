import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { LessonContentService, LessonError } from "@modules/domain/lesson"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { attemptKindOf, attemptPhaseOf, normalizeAnswer } from "./attempt-answer.policy"
import { AttemptService } from "./attempt.service"
import type { AttemptResult, GuestChoiceAnswer, GuestClaimView } from "./attempt.contracts"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"
import { gradeChoice } from "./choice-grading.policy"
import { SELECT_GRADED_ACTIVITY_IDS } from "./persistence/attempt.sql"

/** The most answers one claim merges. */
export const GUEST_CLAIM_MAX = 60

/** The revision a claimed answer is stored under: the learner's first answer to the activity. */
const CLAIM_REVISION = 1

@Injectable()
/**
 * What a guest may do with attempts: have one free choice graded on the spot with nothing stored, and, once signed in, have the
 * answers kept on the device merged into the account. The merge re-grades every answer here and trusts nothing from the device.
 */
export class AttemptGuestService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        private readonly content: LessonContentService,
        private readonly attempts: AttemptService,
    ) {}

    /** Grades one choice of free content for a guest; it writes nothing. Content that is not free needs Premium. */
    async grade(params: GuestChoiceAnswer): Promise<AttemptResult> {
        const found = await this.content.activity({
            lessonId: params.lessonId,
            version: params.version,
            activityId: params.activityId,
            locale: params.locale,
        })
        if (found.activity.kind !== "choice") throw new AttemptError({ code: AttemptErrorCode.ActivityUnsupported })
        this.content.requireGuestAccess({ phase: attemptPhaseOf(found), isPremium: found.isPremium, part: found.part })
        const answer = normalizeAnswer(found.activity, attemptKindOf(found.activity), {
            optionId: params.optionId,
            text: null,
            actionIds: null,
            reachedStateId: null,
            debrief: null,
            files: null,
        })
        return gradeChoice(found.activity, answer)
    }

    /**
     * Stores the answers a guest gave before signing in, for the learner, grading each again. An activity the learner already answered
     * is left alone, so a second claim changes nothing; an answer that is not free, not a choice or no longer in the lesson is skipped.
     */
    async claim(learnerId: string, answers: ReadonlyArray<GuestChoiceAnswer>): Promise<GuestClaimView> {
        const wanted = answers.slice(0, GUEST_CLAIM_MAX)
        const answered = new Map<string, Set<string>>()
        let claimed = 0
        for (const answer of wanted) {
            const key = JSON.stringify([answer.lessonId, answer.version])
            let done = answered.get(key)
            if (done === undefined) {
                const rows: Array<{ activity_id: string }> = await this.entityManager.query(
                    SELECT_GRADED_ACTIVITY_IDS,
                    [learnerId, answer.lessonId, answer.version, LIST_ROWS_MAX],
                )
                done = new Set(rows.map((row) => row.activity_id))
                answered.set(key, done)
            }
            if (done.has(answer.activityId)) continue
            if (await this.store(learnerId, answer)) {
                claimed += 1
                done.add(answer.activityId)
            }
        }
        return { claimed, skipped: answers.length - claimed }
    }

    /** Stores one answer; any refusal of the lesson or the attempt rules leaves it out. */
    private async store(learnerId: string, answer: GuestChoiceAnswer): Promise<boolean> {
        try {
            await this.attempts.submit({
                learnerId,
                lessonId: answer.lessonId,
                version: answer.version,
                activityId: answer.activityId,
                revision: CLAIM_REVISION,
                locale: answer.locale,
                answer: {
                    optionId: answer.optionId,
                    text: null,
                    actionIds: null,
                    reachedStateId: null,
                    debrief: null,
                    files: null,
                },
            })
            return true
        } catch (error) {
            if (error instanceof LessonError || error instanceof AttemptError) return false
            throw error
        }
    }
}
