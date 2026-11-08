import { Module, type DynamicModule } from "@nestjs/common"
import { platformModules } from "./compose/platform"
import { integrationsModules } from "./compose/integrations"
import { cliModules } from "./compose/cli"
import { domainModules } from "./compose/domain"
import type { CliAppOptions } from "./cli.options"

@Module({})
/**
 * The composition root of the cli: the clock and the logger every command logs through, the database capability over every
 * connection with its entities and migrations, the domain capabilities its commands drive, and the cli feature root.
 */
export class AppModule {
    /** Builds the cli from its parsed options. */
    static register(options: CliAppOptions): DynamicModule {
        return {
            module: AppModule,
            imports: [
                ...platformModules(options),
                ...integrationsModules(options),
                ...domainModules(options),
                ...cliModules(),
            ],
        }
    }
}
