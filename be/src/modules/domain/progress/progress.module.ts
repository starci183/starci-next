import { Module, type DynamicModule } from "@nestjs/common"
import { ProgressHarnessClient } from "./progress-harness.client"
import { PROGRESS_HARNESS } from "./progress-harness.port"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./progress.module-definition"
import { ProgressService } from "./progress.service"

@Module({})
/** The progress capability: one read model of how far a learner has come, built from the other capabilities and storing nothing. */
export class ProgressModule extends ConfigurableModuleClass {
    /** Registers the progress service over the harness capability. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                ProgressHarnessClient,
                { provide: PROGRESS_HARNESS, useExisting: ProgressHarnessClient },
                ProgressService,
            ],
            exports: [ProgressService],
        }
    }
}
