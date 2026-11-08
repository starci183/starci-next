import { Module, type DynamicModule } from "@nestjs/common"
import { FetchHttpClient } from "./fetch-http-client.client"
import { HTTP_WIRE } from "./http-wire.port"
import { NodeHttpWire } from "./node-http-wire.client"
import { HTTP_CLIENT } from "./http.decorators"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./http.module-definition"

@Module({})
/** Provides the HttpClient port backed by `fetch` and the raw HttpWire port over Node's http, https and dns. */
export class HttpModule extends ConfigurableModuleClass {
    /** Registers the capability once per app. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                { provide: HTTP_CLIENT, useClass: FetchHttpClient },
                { provide: HTTP_WIRE, useClass: NodeHttpWire },
            ],
            exports: [HTTP_CLIENT, HTTP_WIRE],
        }
    }
}
