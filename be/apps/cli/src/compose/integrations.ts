import type { DynamicModule, Type } from "@nestjs/common"
import { Judge0Module } from "@modules/integrations/judge0"
import { AiGatewayModule } from "@modules/integrations/ai-gateway"
import { SepayModule } from "@modules/integrations/sepay"
import { PayosModule } from "@modules/integrations/payos"
import type { CliAppOptions } from "../cli.options"

/**
 * The provider integrations of the cli, registered once and app-wide. A `null` channel still composes the rail: every
 * call refuses instead of trusting a channel nobody named.
 */
export const integrationsModules = (options: CliAppOptions): Array<Type<unknown> | DynamicModule> => [
    SepayModule.register({ isGlobal: true, channel: options.sepay }),
    PayosModule.register({ isGlobal: true, channel: options.payos }),
    // The bank calibration grades sample answers through the AI pool; without a declared key it refuses.
    AiGatewayModule.register({ isGlobal: true, gateway: options.aiGateway }),
    // The cli imports problems and runs no code: the judge composes unconfigured.
    Judge0Module.register({ isGlobal: true, judge0: null }),
]
