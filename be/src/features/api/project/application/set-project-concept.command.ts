import { Command } from "@nestjs/cqrs"
import type { ConceptView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SetProjectConceptRequest } from "./set-project-concept.contracts"

/** Points a concept of a project at code and at the endpoint the probes aim at. */
export class SetProjectConceptCommand extends Command<ConceptView> {
    constructor(readonly params: ExecuteParams<SetProjectConceptRequest>) {
        super()
    }
}
