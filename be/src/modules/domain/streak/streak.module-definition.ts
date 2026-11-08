import { defineCapabilityModule } from "@starci/nest-kit"
import { STREAK_OPTIONS } from "./streak.decorators"
import type { StreakOptions } from "./streak.options"

/** The configurable-module base of the streak capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<StreakOptions>({
    optionsInjectionToken: STREAK_OPTIONS,
})
