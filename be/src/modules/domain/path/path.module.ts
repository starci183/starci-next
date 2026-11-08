import { Module, type DynamicModule } from "@nestjs/common"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./path.module-definition"
import { PathService } from "./path.service"

@Module({})
/** The path capability: the catalog of the five outcome paths and the one path each learner follows. */
export class PathModule extends ConfigurableModuleClass {
    /** Registers the path service. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return { ...base, providers: [...(base.providers ?? []), PathService], exports: [PathService] }
    }
}
