import { createI18nNavigation, type I18nNavigation } from "@starci/next-i18n/navigation"
import { i18n, type ProductI18n } from "./routing"

/** The locale-aware navigation of the product's one routing configuration; safe in a client component (no server-only import). */
export const navigation: I18nNavigation<ProductI18n["locales"], ProductI18n["localePrefix"]> =
    createI18nNavigation(i18n)
