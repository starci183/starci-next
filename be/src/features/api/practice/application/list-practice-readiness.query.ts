import { Query } from "@nestjs/cqrs"
import type { PracticeReadinessView } from "@modules/domain/practice"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListPracticeReadinessRequest } from "./list-practice-readiness.contracts"

/** Asks for the readiness per pattern. */
export class ListPracticeReadinessQuery extends Query<ReadonlyArray<PracticeReadinessView>> {
    constructor(readonly params: ExecuteParams<ListPracticeReadinessRequest>) {
        super()
    }
}
