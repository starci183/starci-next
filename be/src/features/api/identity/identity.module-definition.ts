import { ConfigurableModuleBuilder } from "@nestjs/common"
import type { IdentityOptions } from "./identity.options"

/** Defines the handler module registration without owning capability state. */
export const { ConfigurableModuleClass } = new ConfigurableModuleBuilder<IdentityOptions>()
    .setClassMethodName("register")
    .build()
