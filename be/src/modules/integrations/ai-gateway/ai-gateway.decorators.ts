import { AiRouterService } from "@starci/ai-router"
import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { AiGatewayModuleOptions, AiGatewayProfile } from "./ai-gateway.options"
import type { AiGateway } from "./ai-gateway.port"

/** Injection token of the AI gateway. */
export const AI_GATEWAY: unique symbol = Symbol("integrations.ai-gateway.gateway")

/** Injection token of the validated AI gateway module options. */
export const AI_GATEWAY_OPTIONS: unique symbol = Symbol("integrations.ai-gateway.options")

/** Injects the AI gateway. Parameter type: AiGateway. */
export const InjectAiGateway = (): TypedParameterDecorator<AiGateway> => injector<AiGateway>(AI_GATEWAY)

/** Injects the validated AI gateway module options. Parameter type: AiGatewayModuleOptions. */
export const InjectAiGatewayOptions = (): TypedParameterDecorator<AiGatewayModuleOptions> =>
    injector<AiGatewayModuleOptions>(AI_GATEWAY_OPTIONS)

/** Injects the package router the gateway guards. Parameter type: AiRouterService. */
export const InjectAiGatewayRouter = (): TypedParameterDecorator<AiRouterService<AiGatewayProfile>> =>
    injector<AiRouterService<AiGatewayProfile>>(AiRouterService)
