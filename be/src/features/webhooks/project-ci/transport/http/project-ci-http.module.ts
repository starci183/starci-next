import { Module } from "@nestjs/common"
import { ProjectCiProofService } from "@modules/domain/project"
import { ConfigurableModuleClass } from "./project-ci-http.module-definition"
import { ProjectCiWebhook } from "./project-ci.webhook"

/** The domain methods that prove a CI delivery before it is trusted: the verifier proves the project's signature before the intake records the run. */
export const webhookVerifiers: ReadonlyArray<ProjectCiProofService["prove"]> = [
    ProjectCiProofService.prototype.prove,
] as const

@Module({ controllers: [ProjectCiWebhook] })
/** The HTTP transport of the signed CI results of the Projects shard: its webhook door; the intake service comes from the project capability. */
export class ProjectCiHttpModule extends ConfigurableModuleClass {}
