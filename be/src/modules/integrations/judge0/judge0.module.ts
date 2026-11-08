import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { JUDGE0_GATEWAY } from "./judge0.decorators"
import { Judge0Client } from "./judge0.client"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./judge0.module-definition"
import { UnconfiguredJudge0Client } from "./unconfigured-judge0.client"

@Module({})
/** The self-hosted Judge0 code judge: consumers receive only the guarded port, never the HTTP calls. */
export class Judge0Module extends ConfigurableModuleClass {
    /** Registers the client over the declared endpoint; a `null` endpoint still composes the judge so every run refuses. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const client = options.judge0 === null ? UnconfiguredJudge0Client : Judge0Client
        const gateway: Provider = { provide: JUDGE0_GATEWAY, useExisting: client }
        return {
            ...base,
            providers: [...(base.providers ?? []), client, gateway],
            exports: [JUDGE0_GATEWAY],
        }
    }
}
