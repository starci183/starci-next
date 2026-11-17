import { defineCapabilityModule } from "@starci/nest-kit"
import { PROFILE_OPTIONS } from "./profile.decorators"
import type { ProfileOptions } from "./profile.options"

/** The configurable-module base of the profile capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<ProfileOptions>({
    optionsInjectionToken: PROFILE_OPTIONS,
})
