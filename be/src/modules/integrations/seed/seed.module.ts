import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { DatabaseStore } from "./database.adapter"
import { SeedDoorService } from "./seed-door.service"
import { DATABASE_SEED_SETS, DATABASE_STORE } from "./seed.decorators"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./seed.module-definition"

@Module({})
/**
 * Composes the store adapters of `@starci/seed` that read only through platform, one per such store `data.stores` of
 * `application-stacks.yaml` declares (PROJECT-STACKS-14): the stack declaration names the adapter file, and this module composes it.
 * The sets of the database store are classes the composition root names (`options.sets`): each belongs to the domain capability whose
 * tables it writes, so this integration never imports the domain.
 */
export class DataSeedModule extends ConfigurableModuleClass {
    /** Registers the capability once per app, with the set classes the app composes into the database store. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const setClasses = options.sets ?? []
        const sets: Provider = {
            provide: DATABASE_SEED_SETS,
            useFactory: (...held: Array<unknown>) => held,
            inject: [...setClasses],
        }
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                ...setClasses,
                sets,
                { provide: DATABASE_STORE, useClass: DatabaseStore },
                SeedDoorService,
            ],
            exports: [DATABASE_STORE, SeedDoorService],
        }
    }
}
