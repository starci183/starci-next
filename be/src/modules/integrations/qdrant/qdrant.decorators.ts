import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import { HTTP_CLIENT, type HttpClient } from "@modules/platform/http"
import type { VectorIndex } from "./qdrant.contracts"
import type { QdrantOptions } from "./qdrant.options"

/** Token of the vector index. */
export const VECTOR_INDEX: unique symbol = Symbol("integrations.qdrant.index")

/** Token of the options the module was registered with. */
export const QDRANT_OPTIONS: unique symbol = Symbol("integrations.qdrant.options")

/** Injects the vector index. Parameter type: VectorIndex. */
export const InjectVectorIndex = (): TypedParameterDecorator<VectorIndex> => injector<VectorIndex>(VECTOR_INDEX)

/** Injects the options the module was registered with. Parameter type: QdrantOptions. */
export const InjectQdrantOptions = (): TypedParameterDecorator<QdrantOptions> => injector<QdrantOptions>(QDRANT_OPTIONS)

/** Injects the platform http client the REST calls go through. Parameter type: HttpClient. */
export const InjectQdrantHttp = (): TypedParameterDecorator<HttpClient> => injector<HttpClient>(HTTP_CLIENT)
