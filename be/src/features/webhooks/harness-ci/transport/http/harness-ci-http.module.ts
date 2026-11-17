import { Module } from "@nestjs/common"
import { HarnessCiService } from "@modules/domain/harness"
import { ConfigurableModuleClass } from "./harness-ci-http.module-definition"
import { HarnessCiWebhook } from "./harness-ci.webhook"

/** The domain method that proves a CI delivery: GitHub OIDC attestation of the bound repository, commit and run, before anything is recorded. */
export const webhookVerifiers: ReadonlyArray<HarnessCiService["recordRun"]> = [
    HarnessCiService.prototype.recordRun,
] as const

@Module({ controllers: [HarnessCiWebhook] })
/** The HTTP transport of the CI runs of /harness builds: its webhook door; the intake service comes from the harness capability. */
export class HarnessCiHttpModule extends ConfigurableModuleClass {}
