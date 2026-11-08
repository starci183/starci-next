import { Command } from "@nestjs/cqrs"
import type { AbandonView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { AbandonInterviewRequest } from "./abandon-interview.contracts"

/** Abandons the active session; an abandoned free session still counts for its month. */
export class AbandonInterviewCommand extends Command<AbandonView> {
    constructor(readonly params: ExecuteParams<AbandonInterviewRequest>) {
        super()
    }
}
