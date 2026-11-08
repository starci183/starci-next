import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { AiRouterModule } from "@starci/ai-router"
import { AI_GATEWAY } from "./ai-gateway.decorators"
import { AiGatewayClient } from "./ai-gateway.client"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./ai-gateway.module-definition"
import { UnconfiguredAiGatewayClient } from "./unconfigured-ai-gateway.client"

@Module({})
/** The AI gateway: completes prompts through the provider pool; consumers receive only the guarded port, never the raw router. */
export class AiGatewayModule extends ConfigurableModuleClass {
    /**
     * Registers the pool once per app from the options the app root parsed (`parseAiGatewayConfig`). A `null` pool still
     * composes the gateway, so every completion refuses with AI_GATEWAY_NOT_CONFIGURED instead of reaching a provider.
     */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const client = options.gateway === null ? UnconfiguredAiGatewayClient : AiGatewayClient
        const pool: Array<DynamicModule> =
            options.gateway === null ? [] : [AiRouterModule.register({ isGlobal: false, ...options.gateway.pool })]
        const gateway: Provider = { provide: AI_GATEWAY, useExisting: client }
        return {
            ...base,
            imports: [...(base.imports ?? []), ...pool],
            providers: [...(base.providers ?? []), client, gateway],
            exports: [AI_GATEWAY],
        }
    }
}
