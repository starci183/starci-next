import type { ModuleFactory } from "@starci/test-world"
import { QdrantModule } from "@modules/integrations/qdrant"
import { Secret } from "@modules/platform/config"
import { HttpModule } from "@modules/platform/http"

/** The collection of the Qdrant world and the size of its vectors. */
export const QDRANT_WORLD = { collection: "world-vectors", dimensions: 3 } as const

/** The modules of the Qdrant world: the bounded http client, then the index pointed at the Qdrant fake with a short deadline so an outage ends fast. */
export const qdrantModules: ReadonlyArray<ModuleFactory> = [
    () => HttpModule.register({ isGlobal: true }),
    (w) =>
        QdrantModule.register({
            isGlobal: true,
            url: w.fake.qdrant?.url ?? "",
            apiKey: new Secret(w.fake.qdrant?.values.apiKey ?? ""),
            timeoutMs: 1000,
            collection: QDRANT_WORLD.collection,
            dimensions: QDRANT_WORLD.dimensions,
            payloadIndexes: ["scope"],
        }),
]
