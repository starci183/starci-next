import { Module, type DynamicModule } from "@nestjs/common"
import { ENTITLEMENT_SERVICE } from "./entitlement.decorators"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./entitlement.module-definition"
import { EntitlementService } from "./entitlement.service"

@Module({})
/** The Premium entitlement capability. */
export class EntitlementModule extends ConfigurableModuleClass {
    /** Registers the entitlement reader and grant service. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                EntitlementService,
                { provide: ENTITLEMENT_SERVICE, useExisting: EntitlementService },
            ],
            exports: [ENTITLEMENT_SERVICE],
        }
    }
}
