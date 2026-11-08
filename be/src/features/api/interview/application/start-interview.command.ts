import { Command } from "@nestjs/cqrs"
import type { SessionView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { StartInterviewRequest } from "./start-interview.contracts"

/** Starts a session: the quota is checked, the questions are drawn and the first prompt is stored. It makes no AI call. */
export class StartInterviewCommand extends Command<SessionView> {
    constructor(readonly params: ExecuteParams<StartInterviewRequest>) {
        super()
    }
}
