import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { StoreAdapter } from "@starci/seed"
import type { SeedSet } from "./seed.contracts"

/** Token of the database's store adapter of the data standard (the store `database` of `data.stores`). */
export const DATABASE_STORE: unique symbol = Symbol("integrations.seed.database-store")

/** Injects the database store adapter. Parameter type: StoreAdapter. */
export const InjectDatabaseStore = (): TypedParameterDecorator<StoreAdapter> => injector<StoreAdapter>(DATABASE_STORE)

/** Token of the sets the app composes into the database store, one per record kind a standard may carry. */
export const DATABASE_SEED_SETS: unique symbol = Symbol("integrations.seed.database-sets")

/** Injects the sets of the database store. Parameter type: ReadonlyArray<SeedSet>. */
export const InjectDatabaseSeedSets = (): TypedParameterDecorator<ReadonlyArray<SeedSet>> =>
    injector<ReadonlyArray<SeedSet>>(DATABASE_SEED_SETS)
