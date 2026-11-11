import type { DynamicModule, Type } from "@nestjs/common"
import { RelayCliModule } from "@features/client-cli/relay-cli"
import { RelayClientModule } from "@modules/integrations/relay-client"
import type { RelayCliAppOptions } from "../relay-cli.options"

/** The learner CLI: the relay client of this machine, and the command groups login, logout, status, devices and run. */
export const cliModules = (options: RelayCliAppOptions): Array<Type<unknown> | DynamicModule> => [
    RelayClientModule.register({ isGlobal: true, env: options.relayClient }),
    RelayCliModule.register({}),
]
