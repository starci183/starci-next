import type { DynamicModule, Type } from "@nestjs/common"
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
]
