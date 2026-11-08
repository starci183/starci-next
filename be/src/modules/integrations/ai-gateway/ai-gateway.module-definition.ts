import { defineCapabilityModule } from "@starci/nest-kit"
import { AI_GATEWAY_OPTIONS } from "./ai-gateway.decorators"
import type { AiGatewayModuleOptions } from "./ai-gateway.options"

/** The configurable-module base of the AI gateway; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<AiGatewayModuleOptions>({
    optionsInjectionToken: AI_GATEWAY_OPTIONS,
})
