import { Query } from "@nestjs/cqrs"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { ListPlansRequest, ListPlansResult } from "./list-plans.contracts"

/** Asks for the server-owned Premium offers. */
export class ListPlansQuery extends Query<ListPlansResult> {
    constructor(readonly params: PublicExecuteParams<ListPlansRequest>) {
        super()
    }
}
