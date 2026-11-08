import { Command } from "@nestjs/cqrs"
import type { ProjectView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SyncProjectPracticeRequest } from "./sync-project-practice.contracts"

/** Pulls the results the learner machine reported over the relay (practice) into a project. */
export class SyncProjectPracticeCommand extends Command<ProjectView> {
    constructor(readonly params: ExecuteParams<SyncProjectPracticeRequest>) {
        super()
    }
}
