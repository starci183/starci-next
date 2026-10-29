import { ConfigurableModuleBuilder } from "@nestjs/common"
import type { IdentityHttpOptions } from "./identity-http.options"

/** Defines the static session HTTP transport registration. */
export const { ConfigurableModuleClass } = new ConfigurableModuleBuilder<IdentityHttpOptions>()
    .setClassMethodName("register")
    .build()
