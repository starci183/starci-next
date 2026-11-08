import { Command } from "@nestjs/cqrs"
import type { ConceptView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ExplainProjectConceptRequest } from "./explain-project-concept.contracts"

/** Has the AI teacher read the code a concept points to and the learner's explanation; it needs Premium. */
export class ExplainProjectConceptCommand extends Command<ConceptView> {
    constructor(readonly params: ExecuteParams<ExplainProjectConceptRequest>) {
        super()
    }
}
