import { Module, type DynamicModule } from "@nestjs/common"
import { QdrantClient } from "./qdrant.client"
import { VECTOR_INDEX } from "./qdrant.decorators"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./qdrant.module-definition"

@Module({})
/**
 * The Qdrant integration: the vector index of the app (Postgres holds the rows, the index the vector of each embedded row).
 * The collection is prepared by the first write, and a collection of another vector size is refused; an unreachable service is
 * a failed call the caller turns into its fallback. The platform http capability must be registered too.
 */
export class QdrantModule extends ConfigurableModuleClass {
    /** Registers the index once per app. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [...(base.providers ?? []), QdrantClient, { provide: VECTOR_INDEX, useExisting: QdrantClient }],
            exports: [VECTOR_INDEX],
        }
    }
}
