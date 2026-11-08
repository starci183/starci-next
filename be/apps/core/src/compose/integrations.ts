import type { DynamicModule } from "@nestjs/common"
import { AI_GATEWAY_ERROR_KINDS, AI_GATEWAY_MESSAGES, AiGatewayModule } from "@modules/integrations/ai-gateway"
import type { ErrorKind } from "@modules/platform/errors"
import type { MessageBundle } from "@modules/platform/i18n"
import type { CoreOptions } from "../core.options"

/**
 * The provider integrations several areas share, registered once and app-wide (each area composes its own providers). Without a
 * declared OpenRouter key the gateway still composes and refuses, so a written answer is saved and not graded.
 */
export const integrationsModules = (options: CoreOptions): Array<DynamicModule> => [
    AiGatewayModule.register({ isGlobal: true, gateway: options.aiGateway }),
]

/** The error kind tables of the shared integrations. */
export const integrationsErrorKinds: ReadonlyArray<Readonly<Record<string, ErrorKind>>> = [AI_GATEWAY_ERROR_KINDS]

/** The message bundles of the shared integrations. */
export const integrationsMessages: ReadonlyArray<MessageBundle> = [AI_GATEWAY_MESSAGES]
