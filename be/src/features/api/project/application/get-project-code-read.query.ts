import { Query } from "@nestjs/cqrs"
import type { CodeReadView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetProjectCodeReadRequest } from "./get-project-code-read.contracts"

/** Reads the newest AI code read of a concept of a project; it needs Premium. */
export class GetProjectCodeReadQuery extends Query<CodeReadView | null> {
    constructor(readonly params: ExecuteParams<GetProjectCodeReadRequest>) {
        super()
    }
}
