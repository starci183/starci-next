import { Command } from "@nestjs/cqrs"
import type { HintView } from "@modules/domain/interview"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { HintInterviewRequest } from "./hint-interview.contracts"

/** Gives the next authored hint of the open question; each hint used takes a little off that question. */
export class HintInterviewCommand extends Command<HintView> {
    constructor(readonly params: ExecuteParams<HintInterviewRequest>) {
        super()
    }
}
