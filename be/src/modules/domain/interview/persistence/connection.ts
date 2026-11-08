import { InterviewBankEntity } from "./entities/interview-bank.entity"
import { InterviewQuestionEntity } from "./entities/interview-question.entity"
import { InterviewSessionEntity } from "./entities/interview-session.entity"
import { InterviewTurnEntity } from "./entities/interview-turn.entity"
import { InitInterview1796300000000 } from "./migrations/1796300000000-init-interview"

/** The entities of the interview capability. */
export const interviewEntities: Array<
    | typeof InterviewBankEntity
    | typeof InterviewQuestionEntity
    | typeof InterviewSessionEntity
    | typeof InterviewTurnEntity
> = [InterviewBankEntity, InterviewQuestionEntity, InterviewSessionEntity, InterviewTurnEntity]

/** The migrations of the interview capability, in the order they run. */
export const interviewMigrations: Array<typeof InitInterview1796300000000> = [InitInterview1796300000000]
