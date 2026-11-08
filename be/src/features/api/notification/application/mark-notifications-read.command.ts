import { Command } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { MarkNotificationsReadRequest } from "./mark-notifications-read.contracts"

/** Asks to mark notifications of the authenticated learner read; the result is how many changed. */
export class MarkNotificationsReadCommand extends Command<number> {
    constructor(readonly params: ExecuteParams<MarkNotificationsReadRequest>) {
        super()
    }
}
