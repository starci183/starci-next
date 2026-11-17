import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { ProfileOptions } from "./profile.options"

/** Injection token of the options of the profile capability. */
export const PROFILE_OPTIONS: unique symbol = Symbol("domain.profile.options")

/** Injects the options of the profile capability. Parameter type: ProfileOptions. */
export const InjectProfileOptions = (): TypedParameterDecorator<ProfileOptions> =>
    injector<ProfileOptions>(PROFILE_OPTIONS)
