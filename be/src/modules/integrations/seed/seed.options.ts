import type { Type } from "@nestjs/common"
import type { SeedSet } from "./seed.contracts"

/** The options of the data standard glue. */
export interface SeedOptions {
    /** The classes of the sets the database store holds, each a provider that implements `SeedSet`. */
    readonly sets?: ReadonlyArray<Type<SeedSet>>
}
