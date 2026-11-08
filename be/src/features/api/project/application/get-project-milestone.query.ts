import { Query } from "@nestjs/cqrs"
import type { MilestoneView } from "@modules/domain/project"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetProjectMilestoneRequest } from "./get-project-milestone.contracts"

/** Reads the concept checklist of one milestone of a project; a milestone past the free ones needs Premium. */
export class GetProjectMilestoneQuery extends Query<MilestoneView> {
    constructor(readonly params: ExecuteParams<GetProjectMilestoneRequest>) {
        super()
    }
}
