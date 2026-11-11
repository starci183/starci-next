import { Module, type DynamicModule } from "@nestjs/common"
import { cliModules } from "./compose/cli"
import { platformModules } from "./compose/platform"
import type { RelayCliAppOptions } from "./relay-cli.options"

@Module({})
/**
 * The composition root of the learner CLI: the clock and the logger every command logs through, and the learner command root.
 * It composes no database, entitlement or ops module, so its build carries none.
 */
export class AppModule {
    /** Builds the learner CLI from its parsed options. */
    static register(options: RelayCliAppOptions): DynamicModule {
        return {
            module: AppModule,
            imports: [...platformModules(), ...cliModules(options)],
        }
    }
}
