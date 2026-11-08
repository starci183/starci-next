import { Module } from "@nestjs/common"
import { ProjectCiService } from "@modules/domain/project"
import { ConfigurableModuleClass } from "./project-ci-http.module-definition"
import { ProjectCiWebhook } from "./project-ci.webhook"

/** The domain methods that prove a CI delivery before it is trusted: the intake verifies the project's signature internally. */
export const webhookVerifiers: ReadonlyArray<ProjectCiService["recordRun"]> = [
    ProjectCiService.prototype.recordRun,
] as const

@Module({ controllers: [ProjectCiWebhook] })
/** The HTTP transport of the signed CI results of the Projects shard: its webhook door; the intake service comes from the project capability. */
export class ProjectCiHttpModule extends ConfigurableModuleClass {}
