import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import type { SessionQuestion } from "./interview.contracts"
import type { QuestionGradingRow, QuestionPublicRow } from "./persistence/interview.rows"
import { SELECT_GRADING_QUESTIONS, SELECT_SESSION_QUESTIONS } from "./persistence/interview.sql"

/** The three parallel arrays the database joins on: bank ids, bank versions and question ids. */
const keysOf = (drawn: ReadonlyArray<SessionQuestion>): [Array<string>, Array<string>, Array<string>] => [
    drawn.map((question) => question.bankId),
    drawn.map((question) => question.bankVersion),
    drawn.map((question) => question.questionId),
]

@Injectable()
/**
 * The only reader of the question rows of a session. `publicOf` answers what the learner and the interviewer may use; `gradingOf`
 * answers the teacher's grading data and is called only by the grader, so nothing used for grading reaches a browser or the interviewer.
 */
export class InterviewQuestionService {
    constructor(@InjectPrimaryEntityManager() private readonly entityManager: EntityManager) {}

    /** The public material of the questions a session drew: prompts, code, diagrams, follow-ups and hints; never grading data. */
    publicOf(
        drawn: ReadonlyArray<SessionQuestion>,
        manager: EntityManager = this.entityManager,
    ): Promise<Array<QuestionPublicRow>> {
        return manager.query(SELECT_SESSION_QUESTIONS, keysOf(drawn))
    }

    /** The grading data of the questions a session drew, at the bank versions it started with. */
    gradingOf(drawn: ReadonlyArray<SessionQuestion>): Promise<Array<QuestionGradingRow>> {
        return this.entityManager.query(SELECT_GRADING_QUESTIONS, keysOf(drawn))
    }
}
