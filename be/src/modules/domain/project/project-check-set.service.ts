import { Injectable } from "@nestjs/common"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import type { ProjectKind } from "./project.contracts"
import type { CheckConcept, CheckMilestone, CheckSet } from "./project-check-set.contracts"
import { InjectProjectCheckSource, type ProjectCheckSource } from "./project-check-set.port"
import { checkSetOf } from "./project-check-set.policy"

@Injectable()
/**
 * The check set of the Projects shard (concepts, milestones, probe flows), read from the content repository as data: adding a concept
 * or a probe is a content change, never app code. It is read again whenever the source answers a new version, and kept otherwise.
 */
export class ProjectCheckSetService {
    private cached: CheckSet | null = null

    constructor(@InjectProjectCheckSource() private readonly source: ProjectCheckSource) {}

    /** The current check set; PROJECT_CHECKS_UNAVAILABLE when there is no content or it does not pass its schema. */
    async current(): Promise<CheckSet> {
        const files = await this.source.read()
        if (files === null) {
            throw new ProjectError({ code: ProjectErrorCode.ChecksUnavailable, params: { detail: "no content" } })
        }
        if (this.cached?.version !== files.version) this.cached = checkSetOf(files)
        return this.cached
    }

    /** The milestones a project of this kind lists, in catalog order. */
    async milestonesOfKind(kind: ProjectKind): Promise<ReadonlyArray<CheckMilestone>> {
        const set = await this.current()
        return set.milestones.filter((milestone) => set.kinds[kind].includes(milestone.id))
    }

    /** The concept, or null when the id is not one. */
    async conceptOf(id: string): Promise<CheckConcept | null> {
        return (await this.current()).concepts.find((concept) => concept.id === id) ?? null
    }
}
