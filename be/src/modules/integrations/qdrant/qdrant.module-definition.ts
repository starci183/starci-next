import { defineCapabilityModule } from "@starci/nest-kit"
import { QDRANT_OPTIONS } from "./qdrant.decorators"
import type { QdrantOptions } from "./qdrant.options"

/** The configurable-module base of the Qdrant capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<QdrantOptions>({
    optionsInjectionToken: QDRANT_OPTIONS,
})
