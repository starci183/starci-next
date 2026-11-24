import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import type { CaseHintEvent, CaseResetEvent, CaseResultEvent } from "@modules/platform/relay-protocol"
import { CourseError, CourseErrorCode } from "./errors/course.error"
import {
    caseOrderOf,
    casesViewOf,
    hintDecisionOf,
    hintTextOf,
    unlockedIdsOf,
    type CaseMark,
    type CaseRef,
} from "./course-case.policy"
import { caseMarksOf, latestRunsOf } from "./course-case.reader"
import type {
    CourseCasesView,
    CourseHintOpened,
    CourseLocale,
    CourseUploadReceipt,
} from "./course-lab.contracts"
import { CourseLabService, type CourseLabLive } from "./course-lab.service"
import {
    INSERT_CASE_RUN,
    LOCK_COURSE_LAB,
    MARK_CASE_GREEN,
    MARK_CASE_HINT,
    MARK_CASE_RESET,
} from "./persistence/course.sql"

/** The case of a lab a request names, or CASE_NOT_FOUND. */
const refOf = (order: ReadonlyArray<CaseRef>, caseId: string): CaseRef => {
    const ref = order.find((each) => each.caseId === caseId)
    if (ref === undefined) throw new CourseError({ code: CourseErrorCode.CaseNotFound })
    return ref
}

/** The hint levels the learner opened on one case. */
const openedOf = (marks: ReadonlyArray<CaseMark>, caseId: string): number =>
    marks.find((mark) => mark.caseId === caseId)?.hintsOpened ?? 0

@Injectable()
/**
 * The learner's state in a lab: which cases are open, the hints they opened and the runs their machine uploaded. A write is stored
 * before anything is shown next and a resend changes nothing twice (conventions rule 5); every write of one learner's lab runs under
 * one lock, so two uploads never decide an unlock on the same marks.
 */
export class CourseCaseService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        private readonly labs: CourseLabService,
    ) {}

    /** Every case of the lab in order with its status, hints, diff and reset for the learner, and the case to work on now. */
    async cases(learnerId: string, lessonId: string): Promise<CourseCasesView> {
        const lab = await this.labs.readable(learnerId, lessonId)
        const [marks, runs] = await Promise.all([
            caseMarksOf(this.entityManager, learnerId, lessonId),
            latestRunsOf(this.entityManager, learnerId, lessonId),
        ])
        return casesViewOf(caseOrderOf(lab.record), marks, runs)
    }

    /** Opens hint `level` of a case: only on an open case and only after the level below; an open level answers again unchanged. */
    async openHint(
        learnerId: string,
        lessonId: string,
        caseId: string,
        level: number,
        locale: CourseLocale,
    ): Promise<CourseHintOpened> {
        const lab = await this.labs.readable(learnerId, lessonId)
        const ref = refOf(caseOrderOf(lab.record), caseId)
        await this.entityManager.transaction(async (manager) => {
            await manager.query(LOCK_COURSE_LAB, [learnerId, lessonId])
            await this.openLevel(manager, learnerId, lessonId, lab, ref, level, CourseErrorCode.HintNotFound)
        })
        const hint = ref.hints[level - 1]
        if (hint === undefined) throw new CourseError({ code: CourseErrorCode.HintNotFound })
        return { caseId, level, text: hintTextOf(hint, locale) }
    }

    /**
     * Stores one `case.result` a machine uploaded (already checked against the relay protocol's schema). A resend of the same client
     * event changes nothing. A green run marks the case ever green only when the case was open: a run of a locked case is kept but never
     * opens the next one.
     */
    async recordCaseResult(
        learnerId: string,
        eventId: string,
        event: CaseResultEvent,
    ): Promise<CourseUploadReceipt> {
        const lab = await this.liveOf(event.lessonId)
        const order = caseOrderOf(lab.record)
        const ref = order.find((each) => each.caseId === event.caseId)
        if (ref === undefined || ref.kind !== event.kind) throw new CourseError({ code: CourseErrorCode.PayloadInvalid })
        const now = this.clock.now()
        return this.entityManager.transaction(async (manager) => {
            await manager.query(LOCK_COURSE_LAB, [learnerId, event.lessonId])
            const inserted: Array<{ event_id: string }> = await manager.query(INSERT_CASE_RUN, [
                learnerId,
                event.lessonId,
                event.caseId,
                event.kind,
                event.status,
                event.ranAt,
                event.durationMs,
                event.learnerCommit,
                JSON.stringify(event.chaos),
                JSON.stringify(event.upTo),
                event.status === "green" || event.failed === undefined ? null : JSON.stringify(event.failed),
                eventId,
                now,
            ])
            if (inserted.length === 0) return { recorded: false }
            if (event.status === "green") {
                const marks = await caseMarksOf(manager, learnerId, event.lessonId)
                if (unlockedIdsOf(order, marks).has(event.caseId))
                    await manager.query(MARK_CASE_GREEN, [learnerId, event.lessonId, event.caseId, now])
            }
            return { recorded: true }
        })
    }

    /** Records a `case.hint`: the level the learner opened through the MCP, in order, on an open case, never lowering what is open. */
    async recordHint(learnerId: string, event: CaseHintEvent): Promise<CourseUploadReceipt> {
        const lab = await this.liveOf(event.lessonId)
        const ref = refOf(caseOrderOf(lab.record), event.caseId)
        return this.entityManager.transaction(async (manager) => {
            await manager.query(LOCK_COURSE_LAB, [learnerId, event.lessonId])
            const opened = await this.openLevel(
                manager,
                learnerId,
                event.lessonId,
                lab,
                ref,
                event.level,
                CourseErrorCode.PayloadInvalid,
            )
            return { recorded: opened }
        })
    }

    /** Records a `case.reset`: the learner reset an unhappy case to its reference step and kept their work on `stashedBranch`. */
    async recordReset(learnerId: string, event: CaseResetEvent): Promise<CourseUploadReceipt> {
        const lab = await this.liveOf(event.lessonId)
        const ref = refOf(caseOrderOf(lab.record), event.caseId)
        if (ref.kind !== "unhappy" || !ref.hasReference) throw new CourseError({ code: CourseErrorCode.PayloadInvalid })
        await this.entityManager.transaction(async (manager) => {
            await manager.query(LOCK_COURSE_LAB, [learnerId, event.lessonId])
            await manager.query(MARK_CASE_RESET, [
                learnerId,
                event.lessonId,
                event.caseId,
                event.stashedBranch,
                event.at,
                this.clock.now(),
            ])
        })
        return { recorded: true }
    }

    /** The live lab an upload names; an upload for a lesson without a lab is refused as not found. */
    private async liveOf(lessonId: string): Promise<CourseLabLive> {
        const lab = await this.labs.live(lessonId)
        if (lab === null) throw new CourseError({ code: CourseErrorCode.LessonNotFound })
        return lab
    }

    /**
     * Opens one hint level inside the lab lock and answers whether it was newly opened. A locked case refuses; a level the case lacks
     * refuses with `missing`; a level above the next one is out of order; an open level changes nothing.
     */
    private async openLevel(
        manager: EntityManager,
        learnerId: string,
        lessonId: string,
        lab: CourseLabLive,
        ref: CaseRef,
        level: number,
        missing: CourseErrorCode,
    ): Promise<boolean> {
        const marks = await caseMarksOf(manager, learnerId, lessonId)
        if (!unlockedIdsOf(caseOrderOf(lab.record), marks).has(ref.caseId))
            throw new CourseError({ code: CourseErrorCode.CaseLocked })
        const decision = hintDecisionOf(openedOf(marks, ref.caseId), level, ref.hints.length)
        if (decision === "missing") throw new CourseError({ code: missing })
        if (decision === "out-of-order") throw new CourseError({ code: CourseErrorCode.HintOutOfOrder })
        if (decision === "already-open") return false
        await manager.query(MARK_CASE_HINT, [learnerId, lessonId, ref.caseId, level, this.clock.now()])
        return true
    }
}
