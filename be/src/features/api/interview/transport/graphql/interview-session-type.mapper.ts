import { toModuleLessons, type SessionView } from "@modules/domain/interview"
import type { InterviewSessionType } from "./dto/interview-session.type"

/** Maps a session to its GraphQL type: the lessons by module slug become a list. */
export const toInterviewSessionType = (view: SessionView): InterviewSessionType => ({
    ...view,
    lessons: toModuleLessons(view),
})
