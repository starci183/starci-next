import { createParamDecorator, type ExecutionContext } from "@nestjs/common"
import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import { localeOfAcceptLanguage } from "./accept-language.policy"
import type { Locale } from "./i18n.contracts"
import type { I18nOptions } from "./i18n.options"
import type { MessageCatalog, RequestLocale } from "./i18n.port"

/** Token of the i18n options, exported so a spec can provide it. */
export const I18N_OPTIONS: unique symbol = Symbol("platform.i18n.options")

/** Token of the MessageCatalog port. */
export const MESSAGE_CATALOG: unique symbol = Symbol("platform.i18n.message-catalog")

/** Token of the RequestLocale port. */
export const REQUEST_LOCALE: unique symbol = Symbol("platform.i18n.request-locale")

/** Injects the options of the i18n capability. Parameter type: I18nOptions. */
export const InjectI18nOptions = (): TypedParameterDecorator<I18nOptions> => injector<I18nOptions>(I18N_OPTIONS)

/** Injects the MessageCatalog port. Parameter type: MessageCatalog. */
export const InjectMessageCatalog = (): TypedParameterDecorator<MessageCatalog> =>
    injector<MessageCatalog>(MESSAGE_CATALOG)

/** Injects the RequestLocale port. Parameter type: RequestLocale. */
export const InjectRequestLocale = (): TypedParameterDecorator<RequestLocale> => injector<RequestLocale>(REQUEST_LOCALE)

/** The locale of the request: the first supported language of its `Accept-Language` header, Vietnamese by default. Argument type: Locale. */
export const AcceptedLocale: (...dataOrPipes: Array<unknown>) => ParameterDecorator = createParamDecorator(
    (_data: unknown, context: ExecutionContext): Locale =>
        localeOfAcceptLanguage(
            context.switchToHttp().getRequest<{ headers: Record<string, string | Array<string> | undefined> }>()
                .headers["accept-language"],
        ),
)
