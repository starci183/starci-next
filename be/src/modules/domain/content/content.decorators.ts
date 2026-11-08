import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { ContentOptions } from "./content.options"

/** Injection token of the options of the content capability. */
export const CONTENT_OPTIONS: unique symbol = Symbol("domain.content.options")

/** Injects the options of the content capability. Parameter type: ContentOptions. */
export const InjectContentOptions = (): TypedParameterDecorator<ContentOptions> =>
    injector<ContentOptions>(CONTENT_OPTIONS)
