import { Module, type DynamicModule } from "@nestjs/common"
import { harnessDirectory } from "./harness-directory.client"
import { HarnessImportService } from "./harness-import.service"
import { HarnessProofService } from "./harness-proof.service"
import { HarnessReadService } from "./harness-read.service"
import { HARNESS_SOURCE } from "./harness-source.port"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./harness.module-definition"

@Module({})
/** The harness capability (the standalone /harness area): its content, the learner reads, the build proof and the project binding. */
export class HarnessModule extends ConfigurableModuleClass {
    /** Registers the import, the reads and the proof. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                HarnessImportService,
                HarnessReadService,
                HarnessProofService,
                { provide: HARNESS_SOURCE, useValue: harnessDirectory },
            ],
            exports: [HarnessImportService, HarnessReadService, HarnessProofService],
        }
    }
}
