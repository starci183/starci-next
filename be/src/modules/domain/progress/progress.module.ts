import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { ProgressHarnessFixtureClient } from "./progress-harness-fixture.client"
import { PROGRESS_HARNESS } from "./progress-harness.port"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./progress.module-definition"
import { ProgressService } from "./progress.service"

@Module({})
/** The progress capability: one read model of how far a learner has come, built from the other capabilities and storing nothing. */
export class ProgressModule extends ConfigurableModuleClass {
    /** Registers the progress service and binds the harness read the app names, or the sample read of the harness contract. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const harnessClass = options.harness ?? ProgressHarnessFixtureClient
        const harness: Provider = { provide: PROGRESS_HARNESS, useExisting: harnessClass }
        return {
            ...base,
            providers: [...(base.providers ?? []), harnessClass, harness, ProgressService],
            exports: [ProgressService],
        }
    }
}
