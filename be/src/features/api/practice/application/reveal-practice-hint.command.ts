import { Command } from "@nestjs/cqrs"
import type { PracticeHintText } from "@modules/domain/practice"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RevealPracticeHintRequest } from "./reveal-practice-hint.contracts"

/** Asks for one step of the hint ladder to open. */
export class RevealPracticeHintCommand extends Command<PracticeHintText> {
    constructor(readonly params: ExecuteParams<RevealPracticeHintRequest>) {
        super()
    }
}
