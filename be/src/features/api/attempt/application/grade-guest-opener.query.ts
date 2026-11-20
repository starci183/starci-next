import { Query } from "@nestjs/cqrs"
import type { AttemptResult } from "@modules/domain/attempt"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { GradeGuestOpenerRequest } from "./grade-guest-opener.contracts"

/** Asks for the grade of one free choice a guest answered; nothing is stored. */
export class GradeGuestOpenerQuery extends Query<AttemptResult> {
    constructor(readonly params: PublicExecuteParams<GradeGuestOpenerRequest>) {
        super()
    }
}
