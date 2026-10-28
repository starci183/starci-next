import { ConfigurableModuleBuilder } from "@nestjs/common"
import type { LessonContentOptions } from "./lesson-content.options"

/** The configurable-module base of the lesson-content capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = new ConfigurableModuleBuilder<LessonContentOptions>()
    .setExtras({ isGlobal: false }, (definition, extras) => ({ ...definition, global: extras.isGlobal }))
    .build()
