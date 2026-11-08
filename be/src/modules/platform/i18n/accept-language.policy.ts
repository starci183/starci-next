import type { AcceptLanguage, Locale } from "./i18n.contracts"

/** The locale of a request that names no supported language. */
export const DEFAULT_REQUEST_LOCALE: Locale = "vi"

/** The first listed language of an `Accept-Language` value that is Vietnamese or English, Vietnamese when none is. */
export const localeOfAcceptLanguage = (acceptLanguage: AcceptLanguage): Locale => {
    const header = typeof acceptLanguage === "string" ? acceptLanguage : (acceptLanguage ?? []).join(",")
    for (const part of header.split(",")) {
        const language = part.trim().slice(0, 2).toLowerCase()
        if (language === "vi" || language === "en") return language
    }
    return DEFAULT_REQUEST_LOCALE
}
