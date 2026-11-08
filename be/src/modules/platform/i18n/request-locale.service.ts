import { Injectable } from "@nestjs/common"
import { localeOfAcceptLanguage } from "./accept-language.policy"
import type { AcceptLanguage, Locale } from "./i18n.contracts"
import type { RequestLocale } from "./i18n.port"

@Injectable()
/** Picks Vietnamese or English from Accept-Language, Vietnamese by default (this example stores no user preference). */
export class AcceptLanguageRequestLocale implements RequestLocale {
    /** The first listed language that is Vietnamese or English, Vietnamese when none is. */
    of(acceptLanguage: AcceptLanguage): Locale {
        return localeOfAcceptLanguage(acceptLanguage)
    }
}
