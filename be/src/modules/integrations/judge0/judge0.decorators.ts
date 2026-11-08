import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import { HTTP_CLIENT, type HttpClient } from "@modules/platform/http"
import type { Judge0ModuleOptions } from "./judge0.options"
import type { Judge0Gateway } from "./judge0.port"

/** Injection token of the code judge. */
export const JUDGE0_GATEWAY: unique symbol = Symbol("integrations.judge0.gateway")

/** Injection token of the validated Judge0 module options. */
export const JUDGE0_OPTIONS: unique symbol = Symbol("integrations.judge0.options")

/** Injects the code judge. Parameter type: Judge0Gateway. */
export const InjectJudge0Gateway = (): TypedParameterDecorator<Judge0Gateway> => injector<Judge0Gateway>(JUDGE0_GATEWAY)

/** Injects the validated Judge0 module options. Parameter type: Judge0ModuleOptions. */
export const InjectJudge0Options = (): TypedParameterDecorator<Judge0ModuleOptions> =>
    injector<Judge0ModuleOptions>(JUDGE0_OPTIONS)

/** Injects the bounded outbound HTTP port the platform provides. Parameter type: HttpClient. */
export const InjectJudge0Http = (): TypedParameterDecorator<HttpClient> => injector<HttpClient>(HTTP_CLIENT)
