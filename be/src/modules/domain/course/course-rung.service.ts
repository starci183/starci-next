import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import type { CaseResetEvent } from "@modules/platform/relay-protocol"
import { CourseError, CourseErrorCode } from "./errors/course.error"
import { CourseCaseService } from "./course-case.service"
import { caseMarksOf } from "./course-case.reader"
import { CourseLabService } from "./course-lab.service"
import {
    diffDecisionOf,
    rungFileOf,
    rungOfSpan,
    rungSpanOf,
    type CourseRungFile,
    type CourseRungSpan,
} from "./course-rung.policy"
import type { CourseLabRecord } from "./course-lab-record.policy"

/** The span of a case, or the error that says why the case has none: an unknown case, or one without a reference rung. */
const spanOrThrow = (record: CourseLabRecord, caseId: string): CourseRungSpan => {
    const read = rungSpanOf(record, caseId)
    if (read.kind === "no-case") throw new CourseError({ code: CourseErrorCode.CaseNotFound })
    if (read.kind === "no-rung") throw new CourseError({ code: CourseErrorCode.RungNotFound })
    return read.span
}

@Injectable()
/**
 * The ladder rungs of a lab, one learner file at a time, for a paired device (course-rung.policy.ts says why the ladder is not shipped).
 * The diff serves a case's two rungs only once the server holds the case's ever-green mark for the learner; the reset serves the case's
 * own rung at any time and records it as the `case.reset` it is. Both read the lab as the learner may (Premium, like the lab itself).
 */
export class CourseRungService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        private readonly labs: CourseLabService,
        private readonly cases: CourseCaseService,
    ) {}

    /**
     * One rung of a case's reference diff: the rung before its fix or its own rung, named by tag. COURSE_RUNG_LOCKED until the server
     * recorded the case green for this learner (an uploaded green run of an open case); COURSE_RUNG_NOT_FOUND for any other tag, so a
     * later rung is never reachable through an earlier, solved case.
     */
    async diffRung(learnerId: string, lessonId: string, caseId: string, tag: string): Promise<CourseRungFile> {
        const lab = await this.labs.readable(learnerId, lessonId)
        const span = spanOrThrow(lab.record, caseId)
        const marks = await caseMarksOf(this.entityManager, learnerId, lessonId)
        const everGreen = marks.some((mark) => mark.caseId === caseId && mark.everGreen)
        const decision = diffDecisionOf(span, tag, everGreen)
        if (decision === "not-found") throw new CourseError({ code: CourseErrorCode.RungNotFound })
        if (decision === "locked") throw new CourseError({ code: CourseErrorCode.RungLocked })
        return rungFileOf(lab.record, rungOfSpan(span, tag))
    }

    /**
     * The reset of a stuck learner: the case's own rung, always allowed (a learner must never be left stuck), and recorded first as the
     * `case.reset` the relay already reports, with the branch the learner's own attempt was kept on. The record comes before the file:
     * a learner who holds the reference rung is always one the lesson page can show as having reset.
     */
    async resetTo(learnerId: string, event: CaseResetEvent): Promise<CourseRungFile> {
        const lab = await this.labs.readable(learnerId, event.lessonId)
        const span = spanOrThrow(lab.record, event.caseId)
        await this.cases.recordReset(learnerId, event)
        return rungFileOf(lab.record, span.reference)
    }
}
